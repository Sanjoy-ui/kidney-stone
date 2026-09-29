import {email, number, z} from "zod"

export const registerZodSchema = z.object({
    username : z.string().min(3 , "username must be minimun 3 characters"),
    email : z.string().email("Invalid email format"),
    contactNo : z.number().gte(1000000000 , "contact no must be 10 numbers ").optional() ,
    password : z.string().min(6 , "password must be atleast 6 characters"),
    photo_url : z.string().url("Invalid image url").optional().or(z.literal("")),
    agreedToTerms: z
        .union([z.boolean(), z.string()])
        .transform((val) => val === true || val === "true" || val === 1 || val === "1")
        .refine((val) => val === true, {
            message: "You must accept the Privacy Policy and Terms of Use to sign up",
        }),
})

export const loginZodSchema = z.object({
    email : z.string().email("Invalid email format"),
    password : z.string().min(6 , "password must be atleast 6 characters")
})