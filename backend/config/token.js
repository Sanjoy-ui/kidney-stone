import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

const getRefreshSecret = () => {
    return process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh_secret_key");
};

/**
 * Generate a short-lived access token (15 minutes)
 */
export const generateAccessToken = (userId, extraPayload = {}) => {
    try {
        return jwt.sign(
            { userId, ...extraPayload },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
    } catch (error) {
        console.error("Access token generation error:", error);
        return null;
    }
};

/**
 * Generate a long-lived refresh token (7 days)
 */
export const generateRefreshToken = (userId) => {
    try {
        return jwt.sign(
            { userId },
            getRefreshSecret(),
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );
    } catch (error) {
        console.error("Refresh token generation error:", error);
        return null;
    }
};

/**
 * Generate both access and refresh tokens for a user
 */
export const generateTokens = (userId, extraPayload = {}) => {
    const accessToken = generateAccessToken(userId, extraPayload);
    const refreshToken = generateRefreshToken(userId);
    return { accessToken, refreshToken };
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, getRefreshSecret());
};

/**
 * Backwards compatibility helper
 */
export const generateToken = async (userId) => {
    return generateAccessToken(userId);
};