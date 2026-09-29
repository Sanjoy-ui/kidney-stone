import express from "express"
import { otpLimiter } from "../utils/ratelimit.js"
import { isAuth } from "../middlewares/isAuth.js"
import { getUser } from "../middlewares/currentUser.middleware.js"
import { getCurrentUser, getFullReportAnalysis } from "../controllers/user.controller.js"

const userRouter = express.Router()

userRouter.get("/profile" , isAuth , getUser , (req , res)=>{
    return res.json({
        success: true,
        user: req.user
    })
})
userRouter.get("/report-details/:reportId" , isAuth , getUser , getFullReportAnalysis)
userRouter.get("/currentuser" , isAuth , getUser , getCurrentUser)



export default userRouter