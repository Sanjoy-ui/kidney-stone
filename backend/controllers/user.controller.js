import { Report } from "../model/report.model.js";
import mongoose from "mongoose";
import User from "../model/user.model.js";
import { responses, sendError, sendSuccess } from "../utils/response.js";


export const getCurrentUser = async (req , res) => {
        try {
            const {userId } = req.userId;
            const user = await User.findOne({userId})
            if(!user){
                return responses.NOT_FOUND(res , "User doesn't exist sign up first")
            }
            return sendSuccess(res , 200 , "User found " )
        } catch (error) {
            return sendError(res , 500 , error )
        }
}

// --- The Formatter Function ---
function formatDoctorResponse(prediction, rawConfidence) {
    if (!prediction) return null;

    let parsed;
    try {
        parsed = typeof prediction === "string" ? JSON.parse(prediction) : prediction;
    } catch (e) {
        // Fallback if JSON parsing fails
        parsed = prediction;
    }

    // Use confidence from parsed object or the fallback rawConfidence from DB
    const label = parsed.label || "Unknown";
    const confidence = parsed.confidence || rawConfidence || 0;

    const isStone = label === "Stone";

    return {
        diagnosis: isStone ? "Kidney stone detected" : "No kidney stone detected",
        confidence: `${confidence}%`,
        severity: isStone ? (confidence > 90 ? "High" : confidence > 70 ? "Moderate" : "Low") : "None",
        summary: isStone
            ? "The uploaded scan indicates a high probability of kidney stone presence."
            : "No significant signs of kidney stones were detected.",
        findings: isStone
            ? ["High-density region detected in kidney area", "Pattern consistent with renal calculi"]
            : ["No abnormal high-density structures observed", "Kidney structure appears normal"],
        recommendations: isStone
            ? ["Consult a urologist", "Increase fluid intake", "Follow medical advice from a specialist"]
            : ["Maintain proper hydration", "Routine health checkups recommended"],
        precautions: [
            "This AI result is not a medical diagnosis",
            "Consult a certified doctor for confirmation"
        ]
    };
}


export const getFullReportAnalysis = async (req, res) => {
    try {
        const { reportId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ success: false, message: "Invalid Report ID" });
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
            { $unwind: "$owner" },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    fileUrl: 1,
                    prediction: 1,
                    confidence: 1,
                    createdAt: 1,
                    patientInfo: {
                        username: "$owner.username",
                        email: "$owner.email",
                        phone: "$owner.ContactNo",
                        photo: "$owner.photo_url"
                    }
                }
            }
        ]);

        if (reports.length === 0) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        const rawReport = reports[0];

        // Apply the formatter
        // Note: We pass rawReport.prediction (JSON string) and rawReport.confidence as fallback
        const formattedAnalysis = formatDoctorResponse(rawReport.prediction, rawReport.confidence);

        return res.status(200).json({
            success: true,
            data: {
                reportId: rawReport._id,
                status: rawReport.status,
                fileUrl: rawReport.fileUrl,
                createdAt: rawReport.createdAt,
                patientInfo: rawReport.patientInfo,
                analysis: formattedAnalysis // This now contains the professional medical breakdown
            }
        });

    } catch (error) {
        console.error("Aggregation Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};