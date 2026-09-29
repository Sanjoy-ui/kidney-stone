import { Report } from "../model/report.model.js";
import { reportQueue } from "../queue/report.queue.js";
import { responses } from "../utils/response.js";

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