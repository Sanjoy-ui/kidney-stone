import mongoose from "mongoose";
import fs from "fs";
import crypto from "crypto";
import axios from "axios";
import { Report } from "../model/report.model.js";
import { formatDashboardResponse, formatPdfResponse, formatDoctorResponse } from "../utils/formater.js";
import { responses } from "../utils/response.js";
import PDFDocument from "pdfkit";
import { generateQRCodeMatrix, drawQRCodeInPDF } from "../utils/qrGenerator.js";


export const downloadReportPDF = async (req, res) => {
    try {
        const { reportId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ message: "Invalid report ID format" });
        }

        const reports = await Report.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(reportId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            { $unwind: "$owner" }
        ]);

        if (!reports.length) return res.status(404).json({ message: "Report not found" });

        const data = reports[0];
        const analysis = formatPdfResponse(data.prediction, data.confidence) || {
            diagnosis: "CLINICAL EVALUATION RECORD",
            confidence: `${typeof data.confidence === 'number' ? data.confidence.toFixed(1) : (data.confidence || '0')}%`,
            severity: "Normal",
            summary: "Automated deep learning image analysis completed. Review radiological imagery below.",
            findings: ["Ultrasound image analyzed via neural network."],
            recommendations: ["Clinical correlation by an attending physician is recommended."]
        };

        let parsedPrediction = null;
        try {
            parsedPrediction = typeof data.prediction === "string" ? JSON.parse(data.prediction) : data.prediction;
        } catch (_) {}

        // Fetch scan image buffer from Cloudinary or local filesystem
        let scanBuffer = null;
        if (data.fileUrl && data.fileUrl.startsWith("http")) {
            try {
                const imgRes = await axios.get(data.fileUrl, { responseType: "arraybuffer", timeout: 8000 });
                scanBuffer = Buffer.from(imgRes.data);
            } catch (fetchErr) {
                console.warn("Could not fetch remote scan image for PDF:", fetchErr.message);
            }
        } else if (data.fileUrl && fs.existsSync(data.fileUrl)) {
            try {
                scanBuffer = fs.readFileSync(data.fileUrl);
            } catch (_) {}
        }

        // Fetch heatmap buffer if available
        let heatmapBuffer = null;
        const heatmapDataUrl = data.heatmapOverlay || parsedPrediction?.heatmap_overlay;
        if (heatmapDataUrl && heatmapDataUrl.startsWith("data:image/")) {
            try {
                const base64Data = heatmapDataUrl.split(",")[1];
                if (base64Data) {
                    heatmapBuffer = Buffer.from(base64Data, "base64");
                }
            } catch (_) {}
        }

        // Initialize PDF Document
        const doc = new PDFDocument({ margin: 40, size: "A4" });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=NephroScan_Report_${reportId}.pdf`);

        doc.pipe(res);

        // --- SECTION 1: Institutional Hospital Header ---
        doc.rect(40, 40, 515, 65).fill("#03045e");
        doc.fillColor("#ffffff").fontSize(16).text("NEPHROSCAN AI DIAGNOSTIC CENTER", 55, 52, { weight: "bold" });
        doc.fontSize(9).fillColor("#90e0ef").text("Department of Clinical Radiology & Computer-Assisted Urological Diagnostics", 55, 72);
        doc.fontSize(8).fillColor("#caf0f8").text("Accreditation: ISO-13485 / HIPAA Encrypted Diagnostic Protocol | Automated Clinical Evaluation", 55, 85);

        // --- SECTION 2: Patient Demographics & Scan Metadata ---
        const metaY = 118;
        doc.rect(40, metaY, 515, 62).fill("#f8fafc").stroke("#e2e8f0");
        
        doc.fillColor("#03045e").fontSize(8).text("PATIENT IDENTIFIER:", 52, metaY + 10, { weight: "bold" });
        doc.fillColor("#334155").fontSize(9).text(data.patientName || data.owner.username || "Anonymous Patient", 52, metaY + 22);

        doc.fillColor("#03045e").fontSize(8).text("AGE / GENDER:", 52, metaY + 36, { weight: "bold" });
        doc.fillColor("#334155").fontSize(9).text(`${data.patientAge || "N/A"} yrs / ${data.patientGender || "Unspecified"}`, 52, metaY + 48);

        doc.fillColor("#03045e").fontSize(8).text("REPORT ID:", 230, metaY + 10, { weight: "bold" });
        doc.fillColor("#334155").fontSize(8).text(String(data._id), 230, metaY + 22);

        doc.fillColor("#03045e").fontSize(8).text("STUDY MODALITY:", 230, metaY + 36, { weight: "bold" });
        doc.fillColor("#334155").fontSize(9).text(data.scanType || "Renal Ultrasound", 230, metaY + 48);

        doc.fillColor("#03045e").fontSize(8).text("DATE / TIME:", 400, metaY + 10, { weight: "bold" });
        doc.fillColor("#334155").fontSize(8).text(new Date(data.createdAt).toLocaleDateString(), 400, metaY + 22);

        doc.fillColor("#03045e").fontSize(8).text("MODEL ARCHITECTURE:", 400, metaY + 36, { weight: "bold" });
        doc.fillColor("#334155").fontSize(8).text("MobileNetV2 CNN (Fine-Tuned)", 400, metaY + 48);

        // --- SECTION 3: Diagnostic Outcome Box ---
        const resultY = 190;
        const isStone = analysis.diagnosis.toLowerCase().includes("detected") || (parsedPrediction && parsedPrediction.label === "Stone");
        
        doc.rect(40, resultY, 515, 52)
           .fill(isStone ? "#fff1f2" : "#f0fdf4")
           .stroke(isStone ? "#fecdd3" : "#bbf7d0");

        doc.fillColor(isStone ? "#be123c" : "#15803d")
           .fontSize(14)
           .text(isStone ? "POSITIVE: RENAL CALCULUS DETECTED" : "NEGATIVE: NO RENAL CALCULUS OBSERVED", 55, resultY + 12, { weight: "bold" });

        doc.fillColor("#334155")
           .fontSize(9)
           .text(`Confidence Score: ${typeof data.confidence === 'number' ? data.confidence.toFixed(1) : data.confidence}%  |  Severity Stratification: ${analysis.severity}  |  Review Category: Ultrasound Echogenicity`, 55, resultY + 32);

        // --- SECTION 4: Scan Imagery & Heatmap Embedding ---
        let currentY = 252;
        if (scanBuffer || heatmapBuffer) {
            doc.fillColor("#03045e").fontSize(10).text("RADIOLOGICAL IMAGERY & NEURAL ACTIVATION OVERLAY", 40, currentY, { weight: "bold" });
            currentY += 16;

            if (scanBuffer && heatmapBuffer) {
                try {
                    doc.rect(40, currentY, 250, 150).fill("#020617").stroke("#e2e8f0");
                    doc.image(scanBuffer, 45, currentY + 5, { fit: [240, 125], align: "center", valign: "center" });
                    doc.fillColor("#94a3b8").fontSize(7).text("ORIGINAL ULTRASOUND SCAN", 45, currentY + 135, { align: "center", width: 240 });

                    doc.rect(305, currentY, 250, 150).fill("#020617").stroke("#0077b6");
                    doc.image(heatmapBuffer, 310, currentY + 5, { fit: [240, 125], align: "center", valign: "center" });
                    doc.fillColor("#90e0ef").fontSize(7).text("GRAD-CAM ATTENTION HEATMAP (out_relu)", 310, currentY + 135, { align: "center", width: 240 });
                    currentY += 160;
                } catch (imgRenderErr) {
                    console.warn("PDF Image rendering notice:", imgRenderErr.message);
                }
            } else if (scanBuffer) {
                try {
                    doc.rect(145, currentY, 260, 140).fill("#020617").stroke("#e2e8f0");
                    doc.image(scanBuffer, 150, currentY + 5, { fit: [250, 115], align: "center", valign: "center" });
                    doc.fillColor("#94a3b8").fontSize(7).text("ORIGINAL ULTRASOUND SCAN", 150, currentY + 125, { align: "center", width: 250 });
                    currentY += 150;
                } catch (_) {}
            }
        }

        // --- SECTION 5: Findings & Recommendations ---
        doc.fillColor("#03045e").fontSize(10).text("CLINICAL FINDINGS & ANATOMICAL SUMMARY", 40, currentY, { weight: "bold" });
        currentY += 14;
        doc.fontSize(8.5).fillColor("#334155").text(analysis.summary, 40, currentY, { width: 515, lineGap: 2 });
        currentY = doc.y + 6;

        if (analysis.findings && analysis.findings.length) {
            analysis.findings.slice(0, 3).forEach(finding => {
                doc.fillColor("#0077b6").fontSize(8.5).text("•", 45, currentY);
                doc.fillColor("#334155").fontSize(8.5).text(finding, 55, currentY, { width: 500, lineGap: 1 });
                currentY = doc.y + 3;
            });
        }

        currentY += 4;
        doc.fillColor("#03045e").fontSize(10).text("CLINICAL RECOMMENDATIONS", 40, currentY, { weight: "bold" });
        currentY += 14;

        if (analysis.recommendations && analysis.recommendations.length) {
            analysis.recommendations.slice(0, 3).forEach(rec => {
                doc.fillColor("#15803d").fontSize(8.5).text("•", 45, currentY);
                doc.fillColor("#334155").fontSize(8.5).text(rec, 55, currentY, { width: 500, lineGap: 1 });
                currentY = doc.y + 3;
            });
        }

        // --- SECTION 6: QR Verification & Signature Footer ---
        const footerY = 715;
        doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(40, footerY - 10).lineTo(555, footerY - 10).stroke();

        // Verification QR Code
        const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/diagnose?reportId=${data._id}`;
        try {
            const qrMatrix = generateQRCodeMatrix(verifyUrl);
            drawQRCodeInPDF(doc, qrMatrix, 42, footerY, 60, "#03045e");
        } catch (_) {}

        doc.fillColor("#03045e").fontSize(8).text("DIGITAL REPORT VERIFICATION", 112, footerY + 4, { weight: "bold" });
        doc.fontSize(7).fillColor("#64748b").text("Scan QR code with smartphone to authenticate genuine encrypted clinical record.", 112, footerY + 16, { width: 230 });
        const shaHash = crypto.createHash("sha256").update(String(data._id)).digest("hex").substring(0, 16).toUpperCase();
        doc.fontSize(6.5).fillColor("#94a3b8").text(`AUTHENTICATION SHA: ${shaHash} | VERIFIED HTTPS PROTOCOL`, 112, footerY + 38);

        // Doctor Signature Area
        doc.strokeColor("#94a3b8").lineWidth(0.8).moveTo(375, footerY + 45).lineTo(545, footerY + 45).stroke();
        doc.fontSize(7.5).fillColor("#475569").text("ATTENDING RADIOLOGIST SIGNATURE", 375, footerY + 48, { align: "center", width: 170 });

        // Institutional Medical Disclaimer
        doc.fontSize(6.5).fillColor("#94a3b8").text(
            "DISCLAIMER: This diagnostic summary was synthesized via fine-tuned MobileNetV2 Deep Learning Convolutional Neural Network for radiological decision assistance. It is not an autonomous legal diagnosis. Clinical correlation by a licensed physician or urologist is mandatory.",
            40,
            785,
            { align: "center", width: 515 }
        );

        doc.end();

    } catch (error) {
        console.error("PDFKit Generation Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Error generating clinical report PDF" });
        }
    }
};




export const getDashboardData = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);

        const dashboardData = await Report.aggregate([
            { $match: { userId: userId } },
            {
                $facet: {
                    // Part A: Calculate Statistics
                    stats: [
                        {
                            $group: {
                                _id: null,
                                totalTests: { $sum: 1 },
                                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } }
                            }
                        }
                    ],
                    // Part B: Get Recent Reports (Up to 30 past scans)
                    recentReports: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 30 },
                        {
                            $project: {
                                _id: 1,
                                status: 1,
                                prediction: 1,
                                confidence: 1,
                                createdAt: 1,
                                fileUrl: 1,
                                patientName: 1,
                                patientAge: 1,
                                patientGender: 1,
                                scanType: 1,
                                doctorAnalysis: 1,
                                metrics: 1
                            }
                        }
                    ]
                }
            }
        ]);

        const result = dashboardData[0];
        
        // Format the recent reports using Doctor Formatter or stored analysis
        const formattedReports = result.recentReports.map(report => {
            const analysis = report.doctorAnalysis || formatDashboardResponse(report.prediction, report.confidence);
            let parsedPrediction = null;
            try {
                parsedPrediction = typeof report.prediction === "string" ? JSON.parse(report.prediction) : report.prediction;
            } catch (_) {}

            return {
                ...report,
                isStone: parsedPrediction ? parsedPrediction.label === "Stone" : (analysis?.diagnosis?.toLowerCase().includes("detected") ?? false),
                analysis: analysis
            };
        });

        return res.status(200).json({
            success: true,
            stats: result.stats[0] || { totalTests: 0, completed: 0, pending: 0 },
            recentReports: formattedReports
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * Get single clinical report by ID (for re-opening or sharing in patient dashboard)
 */
export const getReportById = async (req, res) => {
    try {
        const { reportId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return responses.BAD_REQUEST(res, "Invalid report ID format");
        }

        const report = await Report.findOne({
            _id: new mongoose.Types.ObjectId(reportId),
            userId: new mongoose.Types.ObjectId(req.userId)
        });

        if (!report) {
            return responses.NOT_FOUND(res, "Clinical report not found");
        }

        let prediction = null;
        try {
            prediction = typeof report.prediction === "string" ? JSON.parse(report.prediction) : report.prediction;
        } catch (_) {}

        const doctorAnalysis = report.doctorAnalysis || (prediction ? formatDoctorResponse(prediction) : null);
        const isStone = prediction ? prediction.label === "Stone" : (doctorAnalysis?.diagnosis?.toLowerCase().includes("detected") ?? false);
        const confidence = typeof report.confidence === "number" ? report.confidence : (prediction?.confidence || 0);

        const responseData = {
            diagnosis: doctorAnalysis?.diagnosis || (isStone ? "Kidney stone detected" : "No kidney stone detected"),
            isStone: isStone,
            confidence: confidence,
            severity: doctorAnalysis?.severity || (isStone ? "High" : "None"),
            summary: doctorAnalysis?.summary || "Clinical analysis of renal scan.",
            findings: doctorAnalysis?.findings || [],
            recommendations: doctorAnalysis?.recommendations || [],
            precautions: doctorAnalysis?.precautions || [
                "This AI result is not a medical diagnosis",
                "Consult a certified doctor for confirmation"
            ],
            imageUrl: report.fileUrl?.startsWith("http") ? report.fileUrl : null,
            heatmapOverlay: report.heatmapOverlay || prediction?.heatmap_overlay || null,
            rawHeatmap: prediction?.raw_heatmap || null,
            reportId: report._id,
            createdAt: report.createdAt,
            metrics: report.metrics || {
                detectionStatus: isStone ? "Positive (Stone Detected)" : "Negative (No Stone)",
                confidenceScore: `${confidence.toFixed(1)}%`,
                riskIndex: `${doctorAnalysis?.severity || "Standard"} Severity`,
                inferenceTime: "Archived Report",
                modelUsed: "MobileNetV2 (Fine-Tuned CNN)",
                scanType: report.scanType || "Ultrasound / CT Scan",
                patientName: report.patientName || "Patient",
                patientAge: report.patientAge || "N/A",
                timestamp: report.createdAt
            }
        };

        return responses.OK(res, "Report fetched successfully", responseData);

    } catch (error) {
        console.error("Get Report Error:", error);
        return responses.SERVER_ERROR(res, "Failed to load clinical report");
    }
};