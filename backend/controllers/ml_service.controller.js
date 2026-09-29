import { Report } from "../model/report.model.js";
import { reportQueue } from "../queue/report.queue.js";
import { responses } from "../utils/response.js";
import { predictImage } from "../services/ml.services.js";
import { formatDoctorResponse } from "../utils/formater.js";
import { uploadToCloudinaryAndCleanup } from "../config/cloudinary.js";
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
            reportId: null,
            metrics: {
                detectionStatus: prediction.label === "Stone" ? "Positive (Stone Detected)" : "Negative (No Stone)",
                confidenceScore: `${confidence.toFixed(1)}%`,
                riskIndex: `${doctorAnalysis.severity} Severity`,
                inferenceTime: processingLatency,
                modelUsed: "MobileNetV2 (Fine-Tuned CNN)",
                scanType: req.body?.scanType || "Ultrasound / CT Scan",
                patientName: req.body?.patientName || "Anonymous Patient",
                patientAge: req.body?.patientAge || "N/A",
                patientGender: req.body?.patientGender || "Unspecified",
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