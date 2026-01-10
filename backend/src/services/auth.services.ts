import bcrypt from "bcrypt";
import User from "../models/user.models";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken
} from "../services/token.services";
import { saveRefreshToken } from "./refreshToken.service";
import redis from "../config/redis.config";

interface RefreshPayload extends JwtPayload {
  id: string;
  admin: boolean;
}

export const authService = {

  register: async (username: string, email: string, password: string) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    const user = await newUser.save();
    return user;
  },

  login: async (email: string, password: string) => {
    const user = await User
      .findOne({ email })
      .select("+password");

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const accessToken = generateAccessToken({
      id: user.id,
      admin: user.admin
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      admin: user.admin
    });

    await saveRefreshToken(user.id, refreshToken);

    const userObj = user.toObject();
    const { password: _, ...safeUser } = userObj;

    return {
      user: safeUser,
      accessToken,
      refreshToken
    };
  },


  requestRefreshToken : async(refreshToken: string) => {
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_KEY;
    const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

    if (!JWT_REFRESH_SECRET) {
      throw new Error("SERVER_CONFIG_ERROR");
    }

    let decoded: RefreshPayload;

    try {
      decoded = jwt.verify(
        refreshToken,
        JWT_REFRESH_SECRET
      ) as JwtPayload as RefreshPayload;
    } catch {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    if (!decoded.id || typeof decoded.admin !== "boolean") {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    const redisKey = `refreshToken:${decoded.id}`;

    const storedToken = await redis.get(redisKey);

    if (!storedToken || storedToken !== refreshToken) {
      await redis.del(redisKey); // revoke toàn bộ session
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      admin: decoded.admin
    });

    const newRefreshToken = generateRefreshToken({
      id: decoded.id,
      admin: decoded.admin
    });

    await redis.set(
      redisKey,
      newRefreshToken,
      "EX",
      REFRESH_TOKEN_TTL
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }
};
