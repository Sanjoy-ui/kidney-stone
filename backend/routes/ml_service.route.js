import express from "express";
import { otpLimiter } from "../utils/ratelimit.js";
import { isAuth, optionalAuth } from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    diagnoseInstant,
    diagnoseBatchInstant,
    uploadAndAnalyze,
    uploadAndAnalyzeMultiple
} from "../controllers/ml_service.controller.js";
import { validateImageFile, validateImageFiles } from "../middlewares/fileValidator.js";

const ml_service_router = express.Router();

// Real-time Instant Diagnosis (single scan)
ml_service_router.post(
    "/diagnose",
    isAuth,
    upload.single("image"),
    validateImageFile,
    diagnoseInstant
);

// Real-time Multi-Slice Instant Batch Diagnosis (2-6 slices)
ml_service_router.post(
    "/diagnose-batch",
    isAuth,
    upload.array("images", 6),
    validateImageFiles,
    diagnoseBatchInstant
);

// Single image prediction (background queue)
ml_service_router.post(
    "/predict",
    otpLimiter,
    isAuth,
    upload.single("image"),
    validateImageFile,
    uploadAndAnalyze
);

// Multiple images prediction (background queue)
ml_service_router.post(
    "/predict-multiple",
    otpLimiter,
    isAuth,
    upload.array("images", 5),
    validateImageFiles,
    uploadAndAnalyzeMultiple
);

export default ml_service_router;
