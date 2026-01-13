import { Router } from "express";
import authController from "../controllers/auth.Controller";
import {verifyToken} from "../middlewares/middlewares"

const router = Router();

router.post("/register", authController.registerUser);

router.post("/login", authController.loginUser);

router.post("/refresh-token", authController.requestRefreshToken)

router.post("/logout", verifyToken, authController.logout)

export default router