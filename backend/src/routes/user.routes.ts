import { Router } from "express";
import userController from "../controllers/user.controller"
import { verifyToken, verifyTokenAdmin } from "../middlewares/middlewares";

const router = Router();

router.get("/",verifyToken, userController.getAllUser);

router.delete("/:id",verifyToken, verifyTokenAdmin, userController.deleteUser);
export default router;