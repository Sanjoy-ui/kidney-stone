/**
 * Response Utility Functions
 * Standardized response format for all API endpoints
 */

export const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

export const sendError = (res, statusCode = 500, message = "Internal Server Error", data = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

/**
 * Common error responses
 */
export const responses = {
    // 2xx Success
    CREATED: (res, data = null) => sendSuccess(res, 201, "Created successfully", data),
    OK: (res, message = "Success", data = null) => sendSuccess(res, 200, message, data),
    SUCCESS: (res, message = "Success", data = null) => sendSuccess(res, 200, message, data),
    ACCEPTED: (res, message = "Request accepted", data = null) => sendSuccess(res, 202, message, data),

    // 4xx Client Errors
    BAD_REQUEST: (res, message = "Bad request") => sendError(res, 400, message),
    UNAUTHORIZED: (res, message = "Unauthorized") => sendError(res, 401, message),
    FORBIDDEN: (res, message = "Forbidden") => sendError(res, 403, message),
    NOT_FOUND: (res, message = "Not found") => sendError(res, 404, message),
    CONFLICT: (res, message = "Resource already exists") => sendError(res, 409, message),
    UNPROCESSABLE: (res, message = "Validation failed") => sendError(res, 422, message),

    // 5xx Server Errors
    SERVER_ERROR: (res, message = "Internal server error") => sendError(res, 500, message),
    SERVICE_UNAVAILABLE: (res, message = "Service unavailable") => sendError(res, 503, message),
};
