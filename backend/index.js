import express from "express";
import { connectDb } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Middleware Imports
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

// Route Imports
import authRouter from "./routes/auth.route.js";
import verifyRouter from "./routes/verify.routes.js";
import userRouter from "./routes/user.route.js";
import ml_service_router from "./routes/ml_service.route.js";
import dashboardRouter from "./routes/dashboard.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth", verifyRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/user", ml_service_router);
app.use("/api/v1/dashboard" , dashboardRouter)

// 404 Handler (before error handler)
app.use(notFoundHandler);

// Global Error Handler (must be last)
app.use(errorHandler);

// Server Initialization
const startServer = async () => {
    try {
        const PORT = process.env.PORT || 5000;

        // Connect to Databases
        await connectDb();
        await connectRedis(); // Ensure Redis connects

        app.listen(PORT, () => {
            console.log(`Server started at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();