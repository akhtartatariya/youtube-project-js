import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`)
        if (!conn) {
            console.log("Database not connected");
        }
        console.log(`MongoDB connected !!: ${conn.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}