import { Request, Response } from "express";
import { userService } from "../services/user.services";

const userController = {

  getAllUser: async (req: Request, res: Response) => {
    try {
      const users = await userService.getAllUsers();

      return res.status(200).json({
        message: "Get all users success",
        users
      });
    } catch (error) {
      return res.status(500).json({
        message: "Get all users failed"
      });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if(!id){
        return res.status(401).json({
            message: "Not ID"
        })
      }

      await userService.deleteUserById(id);

      return res.status(200).json({
        message: "Delete user success"
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          message: "User not found"
        });
      }

      return res.status(500).json({
        message: "Delete user failed"
      });
    }
  }
};

export default userController;
