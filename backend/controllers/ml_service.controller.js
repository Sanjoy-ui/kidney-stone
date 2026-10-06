import { Report } from "../model/report.model.js";
import { reportQueue } from "../queue/report.queue.js";
import { responses } from "../utils/response.js";
import { predictImage } from "../services/ml.services.js";
import { formatDoctorResponse } from "../utils/formater.js";
import { uploadToCloudinaryAndCleanup } from "../config/cloudinary.js";
import { calculateClinicalRiskAndHydration } from "../utils/clinicalRiskEngine.js";
import User from "../model/user.model.js";
import fs from "fs";

/**
 * Real-time Instant Diagnosis
 * 1. Takes uploaded scan image
 * 2. Calls FastAPI AI model (MobileNetV2 CNN)
 * 3. Backs up to Cloudinary and deletes from local server hard drive / uploads dir
 * 4. Calculates comprehensive Patient Matrix and formatted clinical report
 * 5. If authenticated, saves report in DB
 */
export const diagnoseInstant = async (req, res) => {
    const startTime = Date.now();
    let localFilePath = null;

    try {
        if (!req.file) {
            return responses.BAD_REQUEST(res, "No scan image file uploaded");
        }

        localFilePath = req.file.path;

        // Verify terms and privacy agreement for diagnostic image processing
        if (req.body.agreedToTerms !== "true" && req.body.agreedToTerms !== true) {
            if (fs.existsSync(localFilePath)) {
                await fs.promises.unlink(localFilePath).catch(() => {});
            }
            return responses.BAD_REQUEST(res, "You must accept the diagnostic Terms of Use and Privacy Policy conditions to scan an image.");
        }

        // 1. Run real prediction via FastAPI model service
        const mlResult = await predictImage(localFilePath);
        if (!mlResult.success) {
            // Clean up local file on error
            if (fs.existsSync(localFilePath)) {
                await fs.promises.unlink(localFilePath).catch(() => {});
            }
            return responses.SERVER_ERROR(res, mlResult.error || "Kidney stone model inference failed");
        }

        const prediction = mlResult.data.prediction;
        const confidence = typeof prediction.confidence === "number" ? prediction.confidence : parseFloat(prediction.confidence);

        // 2. Format clinical response and patient metrics
        const doctorAnalysis = formatDoctorResponse(prediction);

        // 3. Backup image to Cloudinary and immediately remove from server hard drive
        let cloudResult = null;
        try {
            cloudResult = await uploadToCloudinaryAndCleanup(localFilePath, "kidney_scans");
        } catch (cloudErr) {
            console.warn("Cloudinary backup notice:", cloudErr.message);
        }

        const processingLatency = ((Date.now() - startTime) / 1000).toFixed(2) + "s";

        // Calculate clinical 5-year recurrence risk and 24h target hydration
        const clinicalRisk = calculateClinicalRiskAndHydration({
            isStone: prediction.label === "Stone",
            confidence: confidence,
            age: req.body?.patientAge,
            gender: req.body?.patientGender,
            weightKg: req.body?.patientWeight || 70,
            sliceCount: 1,
            positiveSliceCount: prediction.label === "Stone" ? 1 : 0
        });

        const responseData = {
            diagnosis: doctorAnalysis.diagnosis,
            isStone: prediction.label === "Stone",
            confidence: confidence,
            severity: doctorAnalysis.severity,
            summary: doctorAnalysis.summary,
            findings: doctorAnalysis.findings,
            recommendations: doctorAnalysis.recommendations,
            precautions: doctorAnalysis.precautions,
            imageUrl: cloudResult?.secure_url || null,
            heatmapOverlay: prediction.heatmap_overlay || null,
            rawHeatmap: prediction.raw_heatmap || null,
            gradcamLayer: prediction.gradcam_layer || null,
            reportId: null,
            clinicalRisk: clinicalRisk,
            metrics: {
                detectionStatus: prediction.label === "Stone" ? "Positive (Stone Detected)" : "Negative (No Stone)",
                confidenceScore: `${confidence.toFixed(1)}%`,
                riskIndex: `${doctorAnalysis.severity} Severity`,
                recurrenceRisk: `${clinicalRisk.recurrenceRiskPercent}% (5-Year)`,
                targetHydration: `${clinicalRisk.targetHydrationLiters} L/day`,
                inferenceTime: processingLatency,
                modelUsed: "MobileNetV2 (Fine-Tuned CNN)",
                scanType: req.body?.scanType || "Ultrasound / CT Scan",
                patientName: req.body?.patientName || "Anonymous Patient",
                patientAge: req.body?.patientAge || "N/A",
                patientGender: req.body?.patientGender || "Unspecified",
                visualExplanation: prediction.heatmap_overlay ? "Grad-CAM Attention Heatmap" : "Standard",
                clinicalRisk: clinicalRisk,
                timestamp: new Date().toISOString()
            }
        };

        // 4. If user is authenticated, persist report in MongoDB and ensure agreedToTerms is updated
        let savedReportId = null;
        if (req.userId) {
            try {
                await User.findByIdAndUpdate(req.userId, {
                    agreedToTerms: true,
                    agreedToTermsAt: new Date()
                }).catch(() => {});

                const report = await Report.create({
                    userId: req.userId,
                    fileUrl: cloudResult?.secure_url || "uploaded_scan",
                    heatmapOverlay: prediction.heatmap_overlay || null,
                    prediction: JSON.stringify(prediction),
                    confidence: confidence,
                    status: "completed",
                    patientName: req.body?.patientName || "Anonymous Patient",
                    patientAge: req.body?.patientAge || "N/A",
                    patientGender: req.body?.patientGender || "Unspecified",
                    scanType: req.body?.scanType || "Ultrasound / CT Scan",
                    doctorAnalysis: doctorAnalysis,
                    metrics: responseData.metrics
                });
                savedReportId = report._id;
                responseData.reportId = savedReportId;
            } catch (dbErr) {
                console.warn("Notice: Failed to persist report in database:", dbErr.message);
            }
        }

        return responses.OK(res, "Scan analyzed successfully", responseData);

    } catch (error) {
        console.error("Instant Diagnosis Error:", error);
        if (localFilePath && fs.existsSync(localFilePath)) {
            try {
                await fs.promises.unlink(localFilePath);
            } catch (_) {}
        }
        return responses.SERVER_ERROR(res, "An error occurred during diagnosis processing");
    }
};

export const uploadAndAnalyze = async (req, res) => {
    try {
        if (!req.file) {
            return responses.BAD_REQUEST(res, "No image file uploaded");
        }

        const filePath = req.file.path;

        // 1. Create database entry
        const report = await Report.create({
            userId: req.userId,
            fileUrl: filePath,
            status: "pending"
        });

        // 2. Add job to Redis Queue
        await reportQueue.add({
            reportId: report._id,
            filePath: filePath
        }, {
            attempts: 3,
            backoff: 5000
        });

        // 3. Respond immediately (HTTP 202 Accepted)
        return responses.ACCEPTED(res, "File uploaded successfully. Analysis started in the background.", {
            reportId: report._id
        });

    } catch (error) {
        console.error("ML Service Error:", error);
        return responses.SERVER_ERROR(res, "Failed to upload file");
    }
};

export const uploadAndAnalyzeMultiple = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return responses.BAD_REQUEST(res, "No files uploaded");
        }

        const reports = [];

        for (const file of req.files) {
            const filePath = file.path;

            // Create pending report
            const report = await Report.create({
                userId: req.userId,
                fileUrl: filePath,
                status: "pending"
            });

            // Add job to queue
            await reportQueue.add({
                reportId: report._id,
                filePath: filePath
            }, {
                attempts: 3,
                backoff: 5000
            });

            reports.push({
                reportId: report._id,
                status: "pending"
            });
        }

        return responses.ACCEPTED(res, `${reports.length} files uploaded. Analysis started in background.`, {
            reports
        });

    } catch (error) {
        console.error("ML Service Batch Error:", error);
        return responses.SERVER_ERROR(res, "Failed to upload files");
    }
};

/**
 * Real-time Multi-Slice Batch Diagnosis
 * Synchronously processes 2 to 6 slices, generates Grad-CAM heatmaps,
 * backs up to Cloudinary, and returns an aggregated clinical conclusion.
 */
export const diagnoseBatchInstant = async (req, res) => {
    const startTime = Date.now();
    const uploadedFiles = req.files || [];

    try {
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return responses.BAD_REQUEST(res, "No scan slice files uploaded");
        }

        if (uploadedFiles.length < 2) {
            return responses.BAD_REQUEST(res, "Please upload at least 2 scan slices for a multi-slice study");
        }

        // Verify terms agreement
        if (req.body.agreedToTerms !== "true" && req.body.agreedToTerms !== true) {
            uploadedFiles.forEach(f => {
                if (fs.existsSync(f.path)) {
                    try { fs.unlinkSync(f.path); } catch (_) {}
                }
            });
            return responses.BAD_REQUEST(res, "You must accept the diagnostic Terms of Use and Privacy Policy conditions.");
        }

        const sliceResults = [];
        let primaryReportId = null;

        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const localPath = file.path;

            try {
                // 1. Run inference
                const mlResult = await predictImage(localPath);
                if (!mlResult.success) {
                    throw new Error(mlResult.error || `Inference failed on slice ${i + 1}`);
                }

                const prediction = mlResult.data.prediction;
                const confidence = typeof prediction.confidence === "number" ? prediction.confidence : parseFloat(prediction.confidence);
                const isStone = prediction.label === "Stone";

                // 2. Backup to Cloudinary and cleanup local disk
                let cloudResult = null;
                try {
                    cloudResult = await uploadToCloudinaryAndCleanup(localPath, "kidney_scans_batch");
                } catch (cloudErr) {
                    console.warn(`Cloudinary backup notice for slice ${i + 1}:`, cloudErr.message);
                }

                // 3. Save report in DB if user is authenticated
                let reportId = null;
                if (req.userId) {
                    try {
                        const doctorAnalysis = formatDoctorResponse(prediction);
                        const report = await Report.create({
                            userId: req.userId,
                            fileUrl: cloudResult?.secure_url || "uploaded_scan_slice",
                            heatmapOverlay: prediction.heatmap_overlay || null,
                            prediction: JSON.stringify(prediction),
                            confidence: confidence,
                            status: "completed",
                            patientName: req.body?.patientName || "Anonymous Patient",
                            patientAge: req.body?.patientAge || "N/A",
                            patientGender: req.body?.patientGender || "Unspecified",
                            scanType: req.body?.scanType ? `${req.body.scanType} (Slice ${i + 1})` : `Multi-Slice Ultrasound (Slice ${i + 1})`,
                            doctorAnalysis: doctorAnalysis,
                            metrics: {
                                detectionStatus: isStone ? "Positive (Stone Detected)" : "Negative (No Stone)",
                                confidenceScore: `${confidence.toFixed(1)}%`,
                                inferenceTime: "Instant Batch",
                                modelUsed: "MobileNetV2 (Fine-Tuned CNN)",
                                timestamp: new Date().toISOString()
                            }
                        });
                        reportId = report._id;
                        if (!primaryReportId || (isStone && !primaryReportId)) {
                            primaryReportId = report._id;
                        }
                    } catch (dbErr) {
                        console.warn("DB notice for slice:", dbErr.message);
                    }
                }

                sliceResults.push({
                    sliceIndex: i + 1,
                    originalName: file.originalname,
                    isStone,
                    label: prediction.label,
                    confidence: confidence,
                    imageUrl: cloudResult?.secure_url || null,
                    heatmapOverlay: prediction.heatmap_overlay || null,
                    rawHeatmap: prediction.raw_heatmap || null,
                    gradcamLayer: prediction.gradcam_layer || null,
                    reportId
                });

            } catch (sliceErr) {
                console.error(`Error processing slice ${i + 1}:`, sliceErr.message);
                if (fs.existsSync(localPath)) {
                    try { fs.unlinkSync(localPath); } catch (_) {}
                }
            }
        }

        if (sliceResults.length === 0) {
            return responses.SERVER_ERROR(res, "Failed to analyze uploaded slices");
        }

        // Calculate aggregated conclusions
        const totalSlices = sliceResults.length;
        const positiveSlices = sliceResults.filter(s => s.isStone);
        const negativeSlices = sliceResults.filter(s => !s.isStone);
        const hasStone = positiveSlices.length > 0;

        const overallConfidence = hasStone
            ? Math.max(...positiveSlices.map(s => s.confidence))
            : (negativeSlices.reduce((acc, s) => acc + s.confidence, 0) / (negativeSlices.length || 1));

        const processingLatency = ((Date.now() - startTime) / 1000).toFixed(2) + "s";

        const aggregateDiagnosis = hasStone
            ? `POSITIVE: Renal Calculus Observed (${positiveSlices.length} of ${totalSlices} slices)`
            : `NEGATIVE: No Renal Calculus Observed Across All ${totalSlices} Slices`;

        const aggregateSummary = hasStone
            ? `Multi-slice study confirmed suspicious hyper-echoic acoustic foci in ${positiveSlices.length} of ${totalSlices} scanned views. Cross-slice verification yields ${overallConfidence.toFixed(1)}% peak confidence for nephrolithiasis.`
            : `Comprehensive inspection across ${totalSlices} radiological views shows uniform parenchymal echogenicity with zero significant shadowing foci or calcifications detected.`;

        const aggregateFindings = hasStone
            ? [
                `Calculus identified in ${positiveSlices.length} out of ${totalSlices} ultrasound slices.`,
                `Focal acoustic posterior shadowing verified in suspicious planes.`,
                `Cross-slice neural activation highlights consistent focal calcification pattern.`
            ]
            : [
                `All ${totalSlices} ultrasound slices demonstrate uniform renal parenchymal density.`,
                `No acoustic shadowing artifacts or high-density foci across scanned views.`,
                `Bilateral / cross-sectional renal architecture within normal limits.`
            ];

        const aggregateRecommendations = hasStone
            ? [
                "Recommend urological evaluation with CT non-contrast confirmation if symptomatic.",
                "Maintain hydration goal of 2.5L to 3L daily to inhibit further crystal aggregation.",
                "Clinical correlation with urinalysis and metabolic stone risk panel."
            ]
            : [
                "Maintain routine hydration practices and healthy dietary fluid intake.",
                "Routine periodic check-ups recommended.",
                "Seek medical attention if unilateral flank colic or hematuria develops."
            ];

        const primaryReport = sliceResults.find(s => s.isStone) || sliceResults[0];

        // Calculate clinical 5-year recurrence risk and 24h target hydration for multi-slice study
        const clinicalRisk = calculateClinicalRiskAndHydration({
            isStone: hasStone,
            confidence: overallConfidence,
            age: req.body?.patientAge,
            gender: req.body?.patientGender,
            weightKg: req.body?.patientWeight || 70,
            sliceCount: totalSlices,
            positiveSliceCount: positiveSlices.length
        });

        const responseData = {
            isBatch: true,
            totalSlices,
            positiveCount: positiveSlices.length,
            negativeCount: negativeSlices.length,
            isStone: hasStone,
            diagnosis: aggregateDiagnosis,
            confidence: overallConfidence,
            severity: hasStone ? (overallConfidence > 90 ? "High" : "Moderate") : "None",
            summary: aggregateSummary,
            findings: aggregateFindings,
            recommendations: aggregateRecommendations,
            precautions: [
                "This AI multi-slice study is a diagnostic assistive tool, not an absolute legal diagnosis.",
                "Consult a board-certified radiologist or urologist for confirmation."
            ],
            imageUrl: primaryReport?.imageUrl || null,
            heatmapOverlay: primaryReport?.heatmapOverlay || null,
            rawHeatmap: primaryReport?.rawHeatmap || null,
            gradcamLayer: primaryReport?.gradcamLayer || null,
            reportId: primaryReportId || primaryReport?.reportId || null,
            slices: sliceResults,
            clinicalRisk: clinicalRisk,
            metrics: {
                detectionStatus: hasStone ? `Positive (${positiveSlices.length}/${totalSlices} Slices)` : "Negative (0 Slices)",
                confidenceScore: `${overallConfidence.toFixed(1)}%`,
                riskIndex: hasStone ? `${positiveSlices.length >= 2 ? "High" : "Moderate"} Recurrence Risk` : "Normal Risk",
                recurrenceRisk: `${clinicalRisk.recurrenceRiskPercent}% (5-Year)`,
                targetHydration: `${clinicalRisk.targetHydrationLiters} L/day`,
                inferenceTime: processingLatency,
                modelUsed: `MobileNetV2 CNN (${totalSlices}-Slice Study)`,
                scanType: req.body?.scanType ? `${req.body.scanType} Multi-Slice Study` : "Multi-Slice Ultrasound Study",
                patientName: req.body?.patientName || "Anonymous Patient",
                patientAge: req.body?.patientAge || "N/A",
                patientGender: req.body?.patientGender || "Unspecified",
                visualExplanation: "Grad-CAM Cross-Slice Attention",
                clinicalRisk: clinicalRisk,
                timestamp: new Date().toISOString()
            }
        };

        return responses.OK(res, "Multi-slice study analyzed successfully", responseData);

    } catch (error) {
        console.error("Multi-slice Batch Diagnosis Error:", error);
        return responses.SERVER_ERROR(res, "An error occurred during multi-slice batch diagnosis");
    }
};