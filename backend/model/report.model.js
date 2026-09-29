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
  }
}, { timestamps: true });

export const Report =  mongoose.model("Report", reportSchema);