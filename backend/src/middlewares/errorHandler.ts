import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (
    err: any, 
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // AppError (lỗi nghiệp vụ)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message
        });
    }

    // JWT error
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
    }

    // Unknown error (system)
    console.error("🔥 UNEXPECTED ERROR:", err);

    return res.status(500).json({
        message: "Internal server error"
    });

}