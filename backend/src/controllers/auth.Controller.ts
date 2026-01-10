// import { Response, Request } from "express";
// import jwt from "jsonwebtoken";
// import User from "../models/user.models";
// import bcrypt from "bcrypt";

// const authController = {
//     registerUser: async(req: Request, res: Response) => {
//         try{
//             const {username, email, password} = req.body
//             if(!username || !email || !password){
//                  return res.status(400).json({
//                     message: "Missing required fields"
//                 });
//             }
//             const salt = await bcrypt.genSalt(10);
//             const hashed = await bcrypt.hash(req.body.password, salt);

//             const newUser = new User({
//                 username: req.body.username,
//                 email: req.body.email,
//                 password: hashed
//             });
//             const user = await newUser.save();
//             return res.status(201).json({
//                 message: "Register success",
//                 user
//             });
//         }catch(err){
//             console.log("Cant' register", err);
//             res.status(500).json({message: "Register Failed"});
//         }
//     },

    
//     loginUser: async(req: Request, res: Response) => {
//         try{
//             const user = await User
//                 .findOne({email: req.body.email})
//                 .select("+password")
//             if(!user){
//                 return res.status(401).json("Invalid email or password");
//             }
//             const validPassword  = await bcrypt.compare(
//                 req.body.password,
//                 user.password
//             );
//             if(!validPassword ){
//                 res.status(401).json({ message: "Invalid email or password" });
//             }
//             let accessToken
//             if(user && validPassword ){
//              accessToken = jwt.sign({
//                     id: user.id,
//                     admin: user.admin
//                 },
//                 process.env.JWT_ACCESS_KEY! as string,
//                 {
//                     expiresIn: "30s"
//                 })
//             }
//             //REFRESHTOKEN
//             const refreshToken = jwt.sign({
//                     id: user.id,
//                     admin: user.admin
//                 },
//                 process.env.JWT_REFRESH_KEY! as string,
//                 {
//                     expiresIn: "7d"
//                 });

//             const userObj = user.toObject();
//             const { password, ...safeUser } = userObj;
//             return res.status(200).json({
//                 message: "Login Success",
//                 user: safeUser, 
//                 accessToken,
//                 refreshToken
//             })
//         }catch(err){
//             return res.status(500).json(err);
//         }
//     }
// }

// export default authController;


import { Request, Response } from "express";
import { authService } from "../services/auth.services";

const authController = {

  registerUser: async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          message: "Missing required fields"
        });
      }

      const user = await authService.register(
        username,
        email,
        password
      );

      return res.status(201).json({
        message: "Register success",
        user
      });

    } catch (error) {
      return res.status(500).json({
        message: "Register failed"
      });
    }
  },

  loginUser: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const {user, accessToken, refreshToken} = 
      await authService.login(email, password);

      res.cookie("refreshToken",refreshToken, {
        httpOnly: true,
        secure: false,
        path:"/",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days

      })

      return res.status(200).json({
        message: "Login success",
        user,
        accessToken
      });

    } catch (error: any) {
      if (error.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      return res.status(500).json({
        message: "Login failed"
      });
    }
  },

  requestRefreshToken : async(req: Request, res: Response) => {
    try{
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          message: "Refresh token missing"
        });
      }

      const tokens = await authService.requestRefreshToken(refreshToken);

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        accessToken: tokens.accessToken
      });
    }catch(error : any){
      if (error.message === "INVALID_REFRESH_TOKEN") {
        return res.status(403).json({
          message: "Invalid refresh token"
        });
      }

      return res.status(500).json({
        message: "Refresh token failed"
      });
    }
  }
};

export default authController;
