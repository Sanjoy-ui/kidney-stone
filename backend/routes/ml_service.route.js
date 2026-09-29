import express from "express"
import { otpLimiter } from "../utils/ratelimit.js"
import { isAuth } from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.middleware.js"
import { uploadAndAnalyze, uploadAndAnalyzeMultiple } from "../controllers/ml_service.controller.js"
import { validateImageFile, validateImageFiles } from "../middlewares/fileValidator.js"

const ml_service_router = express.Router()

// Single image prediction
ml_service_router.post(
    "/predict",
    otpLimiter,
    isAuth,
    upload.single("image"),
    validateImageFile,
    uploadAndAnalyze
)

// Multiple images prediction
ml_service_router.post(
    "/predict-multiple",
    otpLimiter,
    isAuth,
    upload.array("images", 5),
    validateImageFiles,
    uploadAndAnalyzeMultiple
)

export default ml_service_router



