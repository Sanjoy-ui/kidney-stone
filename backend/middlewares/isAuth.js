import jwt from "jsonwebtoken";

export const isAuth = async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.cookies?.token ||
            req.headers?.authorization?.replace(/^Bearer\s+/i, "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
                code: "AUTH_REQUIRED"
            });
        }

        let verifyToken;
        try {
            verifyToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Access token expired. Please refresh token.",
                    code: "TOKEN_EXPIRED"
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
                code: "INVALID_TOKEN"
            });
        }

        if (!verifyToken || !verifyToken.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload.",
                code: "INVALID_TOKEN"
            });
        }

        req.userId = verifyToken.userId;
        next();
    } catch (error) {
        console.error("Authentication middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Authentication failed",
            code: "SERVER_ERROR"
        });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.cookies?.token ||
            req.headers?.authorization?.replace(/^Bearer\s+/i, "");

        if (token) {
            try {
                const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
                if (verifyToken?.userId) {
                    req.userId = verifyToken.userId;
                }
            } catch (_) {
                // Ignore expired or invalid token for optional auth
            }
        }
        next();
    } catch (_) {
        next();
    }
};