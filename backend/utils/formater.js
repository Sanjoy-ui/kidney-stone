import { Report } from "../model/report.model.js";
import mongoose from "mongoose";



export function formatDoctorResponse(prediction) {
    if (!prediction) return null;

    let parsed = null;
    if (typeof prediction === "object" && prediction !== null) {
        parsed = prediction;
    } else if (typeof prediction === "string") {
        try {
            parsed = JSON.parse(prediction);
        } catch (_) {
            const isStoneText = prediction.toLowerCase().includes("stone") || prediction.toLowerCase().includes("positive") || prediction.toLowerCase().includes("detected");
            parsed = { label: isStoneText ? "Stone" : "Normal", confidence: 95 };
        }
    }

    const label = parsed?.label || "Unknown";
    const confidence = typeof parsed?.confidence === "number" ? parsed.confidence : 0;
    const isStone = label === "Stone";

    return {
        diagnosis: isStone
            ? "Kidney stone detected"
            : "No kidney stone detected",

        confidence,

        severity: isStone
            ? confidence > 90
                ? "High"
                : confidence > 70
                ? "Moderate"
                : "Low"
            : "None",

        summary: isStone
            ? "The uploaded scan indicates a high probability of kidney stone presence."
            : "No significant signs of kidney stones were detected.",

        findings: isStone
            ? [
                "High-density region detected in kidney area",
                "Pattern consistent with renal calculi"
            ]
            : [
                "No abnormal high-density structures observed",
                "Kidney structure appears normal"
            ],

        recommendations: isStone
            ? [
                "Consult a urologist",
                "Increase fluid intake",
                "Follow medical advice from a specialist"
            ]
            : [
                "Maintain proper hydration",
                "Routine health checkups recommended"
            ],

        precautions: [
            "This AI result is not a medical diagnosis",
            "Consult a certified doctor for confirmation"
        ]
    };
}


export const formatPdfResponse = (prediction, rawConfidence) => {
    if (!prediction || prediction === "null") return null;

    let parsed = null;
    if (typeof prediction === "object" && prediction !== null) {
        parsed = prediction;
    } else if (typeof prediction === "string") {
        try {
            parsed = JSON.parse(prediction);
        } catch (_) {
            const isStoneText = prediction.toLowerCase().includes("stone") || prediction.toLowerCase().includes("positive") || prediction.toLowerCase().includes("detected");
            const confVal = typeof rawConfidence === "number" ? rawConfidence : parseFloat(rawConfidence) || 95;
            parsed = { label: isStoneText ? "Stone" : "Normal", confidence: confVal };
        }
    }

    const label = parsed?.label || "Unknown";
    const confidence = typeof parsed?.confidence === "number" ? parsed.confidence : (typeof rawConfidence === "number" ? rawConfidence : parseFloat(rawConfidence) || 0);
    const isStone = label === "Stone" || String(label).toLowerCase().includes("stone");

    return {
        // Formal wording for the report header
        diagnosis: isStone ? "KIDNEY STONE DETECTED" : "NO KIDNEY STONE DETECTED",
        
        // Formatted for a professional document
        confidence: `${confidence.toFixed(2)}%`,
        severity: isStone 
            ? (confidence > 90 ? "High" : confidence > 70 ? "Moderate" : "Low") 
            : "None",

        // Descriptive paragraph for the 'Summary' section
        summary: isStone
            ? "The AI-driven analysis of the provided renal scan has identified structures with high radiopacity consistent with nephrolithiasis (kidney stones)."
            : "The analysis of the provided renal scan shows no significant evidence of high-density calcifications or obstructive calculi.",

        // Bullet points for 'Findings'
        findings: isStone
            ? [
                "Presence of high-density calcified mass in the renal area.",
                "Shadowing patterns consistent with solid calculi.",
                "Localized density measurements exceed standard soft tissue thresholds."
            ]
            : [
                "Renal parenchyma appears uniform in density.",
                "No abnormal radiopaque structures observed.",
                "Kidney architecture is within normal physiological limits."
            ],

        // Formal medical advice for 'Recommendations'
        recommendations: isStone
            ? [
                "Immediate consultation with a Urologist for clinical correlation.",
                "Maintain high hydration levels (2.5L - 3L water daily).",
                "Possible lifestyle/dietary adjustments pending metabolic evaluation.",
                "Follow-up imaging as prescribed by a medical professional."
            ]
            : [
                "Continue standard hydration practices.",
                "Maintain routine annual health screenings.",
                "Monitor for any future onset of flank pain or hematuria."
            ],

        // Legal footer
        disclaimer: "This report was generated by an automated Artificial Intelligence system. It serves as a supportive tool for clinical decision-making and does not replace a professional urological diagnosis."
    };
};

// Updated to accept two parameters
export function formatDashboardResponse(prediction, rawConfidence) {
    if (!prediction || prediction === "null") return null;

    let parsed;
    try {
        parsed = typeof prediction === "string" ? JSON.parse(prediction) : prediction;
    } catch (e) {
        console.error("Formatting Error: Invalid JSON", prediction);
        return null;
    }

    const label = parsed?.label || "Unknown";
    
    // Priority: 1. Value inside JSON, 2. Value from DB column, 3. Zero
    const confidence = parsed?.confidence || rawConfidence || 0;
    
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
        precautions: ["This AI result is not a medical diagnosis", "Consult a certified doctor for confirmation"]
    };
}