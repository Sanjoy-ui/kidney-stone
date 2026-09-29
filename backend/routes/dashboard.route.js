import express from "express"
import { isAuth } from "../middlewares/isAuth.js"
import { getUser } from "../middlewares/currentUser.middleware.js"
import { otpLimiter } from "../utils/ratelimit.js"
import { downloadReportPDF, getDashboardData } from "../controllers/dashboard.controller.js"

const dashboardRouter = express.Router()

dashboardRouter.get("/getdata" ,otpLimiter ,  isAuth , getUser , getDashboardData )
dashboardRouter.post(`/download-report/:reportId` ,otpLimiter ,  isAuth , getUser , downloadReportPDF )



export default dashboardRouter