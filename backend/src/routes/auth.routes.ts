import { Router } from "express";
import authController from "../controllers/auth.Controller";

const router = Router();

router.post("/register", authController.registerUser);

router.post("/login", authController.loginUser);

router.post("/refresh-token", authController.requestRefreshToken)

export default router