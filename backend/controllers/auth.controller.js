import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import { sendMail } from "../utils/mail.auth.verify.js";
import { generateToken } from "../config/token.js";
import crypto from "crypto"
import {
    loginZodSchema,
    registerZodSchema,
} from "../validators/auth.validator.js";
import { sendSuccess, sendError, responses } from "../utils/response.js";
import axios from "axios";

export const registerUser = async (req, res) => {
    try {
        const validateData = registerZodSchema.parse(req.body);

        const { username, email, contactNo, password, photo_url } = validateData;
        const isUserExists = await User.findOne({ email });

        if (isUserExists) {
            return responses.CONFLICT(res, "User already exists. Please login with your credentials.");
        }

        const hashedPassword = await bcrypt.hash(password, 15);

        let imageURL = null;
        if(req.file){
          imageURL = req.file.filename; // multer
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const hashOtp = await bcrypt.hash(otp.toString(), 10);

        const user = await User.create({
            username,
            email,
            contactNo,
            password: hashedPassword,
            photo_url: imageURL || photo_url,
            agreedToTerms: true,
            agreedToTermsAt: new Date(),
            otpHash: hashOtp,
            otpExpiry: Date.now() + 5 * 60 * 1000,
        });

        // Send verification OTP via email
        await sendMail(email, "Email Verification OTP", `Your OTP is ${otp}`);

        return responses.CREATED(res, {
            message: "User registered successfully. Please verify your email with the OTP sent.",
            userId: user._id,
            email: user.email
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        if (error.name === "ZodError") {
            const msg = error.issues?.[0]?.message || error.errors?.[0]?.message || "Validation failed";
            return responses.UNPROCESSABLE(res, msg);
        }
        return responses.SERVER_ERROR(res, "Sign up failed");
    }
};

import {
    generateTokens,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from "../config/token.js";

const isProduction = process.env.NODE_ENV === "production";

export const setAuthCookies = (res, accessToken, refreshToken) => {
    const baseOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
    };

    // Access token: 15 minutes
    res.cookie("accessToken", accessToken, {
        ...baseOptions,
        maxAge: 15 * 60 * 1000,
    });

    // Also set legacy "token" cookie for backward compatibility (15 minutes)
    res.cookie("token", accessToken, {
        ...baseOptions,
        maxAge: 15 * 60 * 1000,
    });

    // Refresh token: 7 days
    res.cookie("refreshToken", refreshToken, {
        ...baseOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const clearAuthCookies = (res) => {
    const baseOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
    };

    res.clearCookie("accessToken", baseOptions);
    res.clearCookie("token", baseOptions);
    res.clearCookie("refreshToken", baseOptions);
};

export const loginUser = async (req, res) => {
    try {
        const validateData = loginZodSchema.parse(req.body);
        const { email, password } = validateData;

        const user = await User.findOne({ email });
        if (!user) {
            return responses.NOT_FOUND(res, "User not found. Please sign up first.");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return responses.UNAUTHORIZED(res, "Invalid email or password");
        }

        if (!user.isVerified) {
            return responses.FORBIDDEN(res, "Please verify your email with OTP before logging in");
        }

        const tokens = generateTokens(user._id, { email: user.email, username: user.username });
        if (!tokens.accessToken || !tokens.refreshToken) {
            return responses.SERVER_ERROR(res, "Token generation failed");
        }

        // Persist refresh token in database for rotation/revocation
        user.refreshToken = tokens.refreshToken;
        await user.save();

        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        return responses.OK(res, "Login successful", {
            userId: user._id,
            email: user.email,
            username: user.username,
            photo_url: user.photo_url,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        if (error.name === "ZodError") {
            return responses.UNPROCESSABLE(res, "Validation failed");
        }
        return responses.SERVER_ERROR(res, "Login failed");
    }
};

export const refreshUserToken = async (req, res) => {
    try {
        const refreshToken =
            req.cookies?.refreshToken ||
            req.body?.refreshToken ||
            req.headers?.["x-refresh-token"];

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is missing. Please log in again.",
                code: "REFRESH_TOKEN_REQUIRED"
            });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: "Refresh token expired or invalid. Please log in again.",
                code: "REFRESH_TOKEN_EXPIRED"
            });
        }

        if (!decoded || !decoded.userId) {
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token payload.",
                code: "INVALID_REFRESH_TOKEN"
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            clearAuthCookies(res);
            return res.status(404).json({
                success: false,
                message: "User account no longer exists.",
                code: "USER_NOT_FOUND"
            });
        }

        // Validate that token matches active token in DB (protection against reuse of revoked tokens)
        if (user.refreshToken && user.refreshToken !== refreshToken) {
            // Potential refresh token theft: invalidate stored token
            user.refreshToken = null;
            await user.save();
            clearAuthCookies(res);
            return res.status(403).json({
                success: false,
                message: "Refresh token has been revoked or superseded. Please log in again.",
                code: "REFRESH_TOKEN_REVOKED"
            });
        }

        // Generate new tokens (token rotation for security)
        const newTokens = generateTokens(user._id, { email: user.email, username: user.username });
        user.refreshToken = newTokens.refreshToken;
        await user.save();

        setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                user: {
                    userId: user._id,
                    email: user.email,
                    username: user.username,
                    photo_url: user.photo_url
                }
            }
        });

    } catch (error) {
        console.error("REFRESH_TOKEN_ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to refresh token",
            code: "SERVER_ERROR"
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        if (req.userId) {
            await User.findByIdAndUpdate(req.userId, { refreshToken: null }).catch(() => {});
        }
    } catch (_) {}

    clearAuthCookies(res);
    return responses.OK(res, "Logged out successfully");
};

export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                userId: req.user._id,
                email: req.user.email,
                username: req.user.username,
                photo_url: req.user.photo_url,
                agreedToTerms: req.user.agreedToTerms,
                isVerified: req.user.isVerified,
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching user" });
    }
};







export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return responses.BAD_REQUEST(res, "Email is required");
        }

        const user = await User.findOne({ email });
        if (!user) {
            return responses.NOT_FOUND(res, "User not found");
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = hashedResetToken;
        user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Create reset URL from environment variable
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `You requested a password reset. Please click on this link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes.`;

        await sendMail(user.email, "Password Reset Request", message);

        return responses.OK(res, "Password reset link sent to your email");

    } catch (error) {
        console.error("FORGOT_PASSWORD_ERROR:", error);
        return responses.SERVER_ERROR(res, "Failed to process password reset request");
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return responses.BAD_REQUEST(res, "New password is required");
        }

        if (password.length < 6) {
            return responses.BAD_REQUEST(res, "Password must be at least 6 characters long");
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return responses.BAD_REQUEST(res, "Invalid or expired reset token");
        }

        const hashedPassword = await bcrypt.hash(password, 15);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        return responses.OK(res, "Password has been reset successfully. You can now log in.");

    } catch (error) {
        console.error("RESET_PASSWORD_ERROR:", error);
        return responses.SERVER_ERROR(res, "Failed to reset password");
    }
};

export const googleAuthLogin = async (req, res) => {
    try {
        const { idToken, email: clientEmail, displayName: clientName, photoURL: clientPhoto } = req.body;

        if (!idToken && !clientEmail) {
            return responses.BAD_REQUEST(res, "ID token or email is required for Google authentication");
        }

        let verifiedEmail = clientEmail;
        let verifiedName = clientName;
        let verifiedPhoto = clientPhoto;

        // Verify ID token with Google Identity Toolkit REST API using FIREBASE_API_KEY from .env
        const apiKey = process.env.FIREBASE_API_KEY;
        if (apiKey && idToken) {
            try {
                const googleRes = await axios.post(
                    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
                    { idToken }
                );
                if (googleRes.data?.users && googleRes.data.users.length > 0) {
                    const gUser = googleRes.data.users[0];
                    verifiedEmail = gUser.email || verifiedEmail;
                    verifiedName = gUser.displayName || verifiedName;
                    verifiedPhoto = gUser.photoUrl || verifiedPhoto;
                }
            } catch (verifyError) {
                console.warn("Google identity lookup note:", verifyError?.response?.data?.error?.message || verifyError.message);
            }
        }

        if (!verifiedEmail) {
            return responses.UNAUTHORIZED(res, "Could not determine user email from Google account");
        }

        const email = verifiedEmail.toLowerCase().trim();
        const username = verifiedName?.trim() || email.split("@")[0] || "User";
        const photo_url = verifiedPhoto || null;

        let user = await User.findOne({ email });

        if (!user) {
            // First time Google sign-in: create user
            const randomPassword = crypto.randomBytes(32).toString("hex");
            const hashedPassword = await bcrypt.hash(randomPassword, 12);

            user = await User.create({
                username,
                email,
                password: hashedPassword,
                photo_url,
                isVerified: true,
                agreedToTerms: true,
                agreedToTermsAt: new Date(),
            });
        } else {
            let needsSave = false;
            if (!user.isVerified) {
                user.isVerified = true;
                needsSave = true;
            }
            if (!user.agreedToTerms) {
                user.agreedToTerms = true;
                user.agreedToTermsAt = new Date();
                needsSave = true;
            }
            if (!user.photo_url && photo_url) {
                user.photo_url = photo_url;
                needsSave = true;
            }
            if (needsSave) {
                await user.save();
            }
        }

        const tokens = generateTokens(user._id, { email: user.email, username: user.username });
        if (!tokens.accessToken || !tokens.refreshToken) {
            return responses.SERVER_ERROR(res, "Token generation failed");
        }

        user.refreshToken = tokens.refreshToken;
        await user.save();

        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        return responses.OK(res, "Google authentication successful", {
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            userId: user._id,
            email: user.email,
            username: user.username,
            photo_url: user.photo_url
        });

    } catch (error) {
        console.error("GOOGLE_AUTH_ERROR:", error);
        return responses.SERVER_ERROR(res, "Google authentication failed");
    }
};
