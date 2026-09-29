import mongoose from "mongoose";

export const connectDb = async () => {
        try {
            const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kidneystone"
            const db = await mongoose.connect(mongoUri)
            console.log("Db connected" , db.connection.host, db.connection.name)
        } catch (error) {
            console.error("db error" , error.message);
            process.exit(1)
        }
}