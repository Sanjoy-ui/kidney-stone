import rateLimit from "express-rate-limit";

// Rate limiter for sensitive OTP operations (5 requests per 10 minutes)
export const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many OTP attempts. Please wait a few minutes before trying again."
    }
});

// Rate limiter for Authentication (login, signup, google oauth)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Generous limit to prevent locking out legitimate users during normal navigation/testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts from this network. Please wait a few minutes."
    }
});

// Rate limiter for general API endpoints
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please slow down."
    }
});