import express from "express";
import { otpLimiter, authLimiter } from "../utils/ratelimit.js";
import {
    forgotPassword,
    getMe,
    googleAuthLogin,
    loginUser,
    logoutUser,
    refreshUserToken,
    registerUser,
    resetPassword
} from "../controllers/auth.controller.js";
import { isAuth, optionalAuth } from "../middlewares/isAuth.js";
import { getUser } from "../middlewares/currentUser.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { optionalValidateImageFile } from "../middlewares/fileValidator.js";

const authRouter = express.Router();

authRouter.post("/signup", authLimiter, upload.single("image"), optionalValidateImageFile, registerUser);
authRouter.post("/login", authLimiter, loginUser);
authRouter.post("/google", authLimiter, googleAuthLogin);

// Refresh Token Endpoints (Access token renew via refresh token)
authRouter.post("/refresh-token", refreshUserToken);
authRouter.get("/refresh-token", refreshUserToken);

// Current Authenticated User Endpoint
authRouter.get("/me", isAuth, getUser, getMe);

// Logout (clears cookies and revokes refresh token)
authRouter.all("/logout", optionalAuth, logoutUser);

authRouter.post("/forgot-password", otpLimiter, forgotPassword);
authRouter.post("/reset-password/:token", otpLimiter, resetPassword);

export default authRouter;
