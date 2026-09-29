import rateLimit from "express-rate-limit"

export const otpLimiter = rateLimit({
    windowMs : 10 * 60 * 1000,
    max : 5,
    message : "too many requests try again later !"
})