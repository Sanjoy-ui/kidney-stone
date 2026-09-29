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
            return responses.UNPROCESSABLE(res, "Validation failed");
        }
        return responses.SERVER_ERROR(res, "Sign up failed");
    }
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

        const token = await generateToken(user._id);
        if (!token) {
            return responses.SERVER_ERROR(res, "Token generation failed");
        }

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return responses.OK(res, "Login successful", {
            userId: user._id,
            email: user.email,
            username: user.username
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        if (error.name === "ZodError") {
            return responses.UNPROCESSABLE(res, "Validation failed");
        }
        return responses.SERVER_ERROR(res, "Login failed");
    }
};

export const logoutUser = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "Strict"
    });

    return responses.OK(res, "Logged out successfully");
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
}
