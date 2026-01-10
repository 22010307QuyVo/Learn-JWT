import jwt, {JwtPayload} from "jsonwebtoken";
import {Response, Request, NextFunction} from "express"


export const verifyToken = (
    req: Request, 
    res: Response, 
    next: NextFunction
    ) => {
    const authHeader  = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message: "Not Found Asscess Token"
        })
    }
    try{
        const decode = jwt.verify(
            token, 
            process.env.JWT_ACCESS_KEY! as string, 
            ) as JwtPayload;

            req.user = decode;
            next();
    }catch(error){
        return res.status(403).json({ 
            message: "Invalid or expired token" 
        });
    }

}

export const verifyTokenAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as JwtPayload;

  if (user.admin || user.id === req.params.id) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden" });
};