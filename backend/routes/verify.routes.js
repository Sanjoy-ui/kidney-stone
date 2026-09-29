import express from "express";
import { otpLimiter } from "../utils/ratelimit.js"
import { resendOTP, verifyOtp } from "../controllers/verify.controller.js"

const verifyRouter = express.Router()

verifyRouter.post("/verify-user" , otpLimiter , verifyOtp)
verifyRouter.post("/resend-otp" , resendOTP)

export default verifyRouter
