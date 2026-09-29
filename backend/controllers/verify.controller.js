import bcrypt from "bcryptjs";
import User from "../model/user.model.js";
import { success } from "zod";
import jwt from "jsonwebtoken"
import { generateTokens } from "../config/token.js";
import { setAuthCookies } from "./auth.controller.js";
import { sendMail } from "../utils/mail.auth.verify.js";

export const verifyOtp = async (req , res) => {
        try {
            const {email , otp } = req.body
            

            const user = await User.findOne({email})
            if(!user) return res.status(404).json({success : true , message : "user not found"});


            if(user.otpExpiry < Date.now()){
                return res.status(400).json({ message: "OTP expired" });

            }
            
            
            const isOtpVerified = await bcrypt.compare(otp.toString() , user.otpHash)
            if(!isOtpVerified){
                return res.status(403).json({
                    success :true,
                    message : "otp verification failed please use correct credentials ."
                })
            };

            user.isVerified = true;
            user.otpHash = null;
            user.otpExpiry = null;
            const tokens = generateTokens(user._id, { email: user.email, username: user.username });
            if (!tokens.accessToken || !tokens.refreshToken) {
                return res.status(500).json({
                    success: false,
                    message: "Token generation failed."
                });
            }

            user.refreshToken = tokens.refreshToken;
            await user.save();

            setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

            return res.status(200).json({
                success: true,
                message: "Account verified successfully.",
                user: {
                    userId: user._id,
                    email: user.email,
                    username: user.username,
                    photo_url: user.photo_url
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });


        } catch (error) {
            console.log("otp verification failed ", error)
            return res.status(200).json({
                success :false,
                message : "account  verification failed ."
            })
        }
}


export const resendOTP = async (req , res) => {
        try {
            
            const {email } = req.body
            if(!email){
                return res.json({
                    success : true,
                    message : "email id required!"
                })
            }

            const otp = Math.floor(100000 + Math.random() * 900000)
            const hashotp = await bcrypt.hash(otp.toString() , 10)

            const user = await User.findOneAndUpdate({email} , {
                otpHash : hashotp,
                otpExpiry : Date.now() + 5 *60 * 1000
            }, {new : true})
            
            await sendMail(email , "verification OTP",`Your OTP is ${otp}`)

            return res.status(200).json({
            success: true,
            message: "OTP resent successfully to your email."
        });

            
        } catch (error) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({ success: false, message: "Failed to resend OTP" });
        }
}