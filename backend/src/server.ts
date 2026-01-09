import express, {Application} from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.routes"

dotenv.config();


const app: Application = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

if(!MONGO_URI) throw new Error("❌ MONGO_URI is not defined in .env");

app.use(express.json());
app.use(cookieParser());
app.use(cors());

const connectDB = async (): Promise<void> => {
    try{
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected");
    }catch(error){
        console.error("❌ MongoDB connection failed", error);
        process.exit(1);
    }
}

const startServer = async () => {
    await connectDB();
}

app.use("/v1/auth", authRoute)

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
})

startServer();