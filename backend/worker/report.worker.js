import { Report } from "../model/report.model.js";
import { reportQueue } from "../queue/report.queue.js";
import { predictImage } from "../services/ml.services.js";
import { connectDb } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB before processing jobs
await connectDb();

// This function runs automatically whenever a job is added to the queue
reportQueue.process(async (job) => {
    const { reportId, filePath } = job.data;
    console.log(`Processing report: ${reportId}`);

    try {
        // 1. Run the ML Prediction
        const result = await predictImage(filePath);

        if (!result.success) {
            throw new Error(result.error || "ML Analysis failed");
        }

        // 2. Extract Data (Fixed your previous variable logic)
        const prediction = result.data.prediction;
        const confidence = result.data.confidence; 

        // 3. Update the Database
        await Report.findByIdAndUpdate(reportId, {
            prediction: JSON.stringify(prediction),
            confidence: confidence,
            status: "completed"
        });

        console.log(`Report ${reportId} completed successfully.`);
        return { status: "success" };

    } catch (error) {
        console.error(`Error processing job ${job.id}:`, error.message);

        // Update DB to failed status
        await Report.findByIdAndUpdate(reportId, { status: "failed" });

        // Re-throw the error so Bull knows the job failed
        throw error;
    }
});

console.log("✅ Report Queue Worker Started - Listening for jobs...");