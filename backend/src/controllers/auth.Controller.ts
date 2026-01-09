import { Response, Request } from "express";
import User from "../models/user.models";
import bcrypt from "bcrypt";

const authController = {
    registerUser: async(req: Request, res: Response) => {
        try{
            const {username, email, password} = req.body
            if(!username || !email || !password){
                 return res.status(400).json({
                    message: "Missing required fields"
                });
            }
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(req.body.password, salt);

            const newUser = new User({
                username: req.body.username,
                email: req.body.email,
                password: hashed
            });
            const user = await newUser.save();
            return res.status(201).json({
                message: "Register success",
                user
            });
        }catch(err){
            console.log("Cant' register", err);
            res.status(500).json({message: "Register Failed"});
        }
    },
    
    loginUser: async(req: Request, res: Response) => {
        try{
            const user = await User.findOne({
                email: req.body.email
            });
            if(!user){
                return res.status(404).json("Wrong email");
            }
            const vailPassword = await bcrypt.compare(
                req.body.password,
                user.password
            );
            if(!vailPassword){
                res.status(403).json("Wrong password");
            }
            if(user && vailPassword){
                res.status(200).json(user)
            }
        }catch(err){
            res.status(500).json(err);
        }
    }
}

export default authController;