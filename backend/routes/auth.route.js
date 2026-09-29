import express from "express"
import { otpLimiter } from "../utils/ratelimit.js"
import { forgotPassword, loginUser, logoutUser, registerUser, resetPassword } from "../controllers/auth.controller.js"
import { isAuth } from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.middleware.js"
import { validateImageFile } from "../middlewares/fileValidator.js"

const authRouter = express.Router()

authRouter.post("/signup", otpLimiter, upload.single("image"), validateImageFile, registerUser)
authRouter.post("/login", otpLimiter, loginUser)
authRouter.get("/logout", isAuth, logoutUser)
authRouter.post("/forgot-password", otpLimiter, forgotPassword)
authRouter.post("/reset-password/:token", otpLimiter, resetPassword)

export default authRouter
