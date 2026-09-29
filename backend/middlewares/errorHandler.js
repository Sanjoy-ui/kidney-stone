/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized response
 */

import { sendError } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
    console.error("Error:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 422;
        message = "Validation failed";
        const errors = Object.values(err.errors).map(e => e.message);
        return sendError(res, statusCode, message, { errors });
    }

    // Mongoose cast error (invalid ID)
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }

    // Zod validation error
    if (err.name === "ZodError") {
        statusCode = 422;
        message = "Validation failed";
        const errors = err.errors.map(e => ({
            field: e.path.join("."),
            message: e.message
        }));
        return sendError(res, statusCode, message, { errors });
    }

    // File upload errors
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            statusCode = 413;
            message = "File size exceeds limit";
        } else if (err.code === "LIMIT_FILE_COUNT") {
            statusCode = 400;
            message = "Too many files";
        } else {
            statusCode = 400;
            message = "File upload error";
        }
    }

    // Custom errors
    if (err.statusCode) {
        statusCode = err.statusCode;
    }

    // Don't expose error details in production
    if (process.env.NODE_ENV === "production") {
        if (statusCode === 500) {
            message = "Internal Server Error";
        }
    }

    return sendError(res, statusCode, message);
};

/**
 * 404 Not Found Handler
 * Must be added after all routes
 */
export const notFoundHandler = (req, res) => {
    return sendError(res, 404, `Route ${req.originalUrl} not found`);
};
