import mongoose from "mongoose";
import { required } from "zod/mini";

const userSchema = new mongoose.Schema({

    username :{
        type :String,
        required : true,
        trim : true,
    },
    email :{
        type :String,
        required : true,
        trim : true,
        toLowerCase : true
    },
    ContactNo :{
        type :Number,
    },
    password:{
        type : String,
        required : true
    },
    photo_url :{
        type : String
    },
    isVerified :{
        type :Boolean,
        default : false
    },
    agreedToTerms: {
        type: Boolean,
        default: false,
        required: true,
    },
    agreedToTermsAt: {
        type: Date,
    },
    otpHash : {
        type : String ,
    },
    otpExpiry : {
        type : Date
    },
    resetPasswordToken:{
        type : String
    },
    resetPasswordExpiry:{
        type :Date
    },
    refreshToken: {
        type: String,
        default: null,
    },
}, {timeseries :true, timestamps:true})


const User = mongoose.model("User" , userSchema)
export default User