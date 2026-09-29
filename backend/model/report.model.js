import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  prediction: String,
  confidence: Number,
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },
  patientName: {
    type: String,
    default: "Patient"
  },
  patientAge: String,
  patientGender: String,
  scanType: {
    type: String,
    default: "Ultrasound / CT Scan"
  },
  doctorAnalysis: {
    type: mongoose.Schema.Types.Mixed
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

export const Report =  mongoose.model("Report", reportSchema);