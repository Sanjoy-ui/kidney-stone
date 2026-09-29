import express from "express"
import { isAuth } from "../middlewares/isAuth.js"
import { getUser } from "../middlewares/currentUser.middleware.js"
import { apiLimiter } from "../utils/ratelimit.js"
import { downloadReportPDF, getDashboardData, getReportById } from "../controllers/dashboard.controller.js"

const dashboardRouter = express.Router()

dashboardRouter.get("/getdata", apiLimiter, isAuth, getUser, getDashboardData)
dashboardRouter.get("/report/:reportId", apiLimiter, isAuth, getUser, getReportById)
dashboardRouter.post(`/download-report/:reportId`, apiLimiter, isAuth, getUser, downloadReportPDF)

export default dashboardRouter