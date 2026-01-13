import bcrypt from "bcrypt";
import User from "../models/user.models";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken
} from "../services/token.services";
import { saveRefreshToken } from "./refreshToken.service";
import redis from "../config/redis.config";
import { AppError } from "../utils/AppError";
import { generateKeyPair } from "../utils/crypto.util";
import { KeyStoreService } from "../services/keyToken.services";

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
    if (!user) {
      throw new AppError("REGISTER_FAILED", 400);
    }

    return user;
  },

  login: async (email: string, password: string) => {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("INVALID_CREDENTIALS", 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError("INVALID_CREDENTIALS", 401);
    }

    const { publicKey, privateKey } = generateKeyPair();

    const accessToken = generateAccessToken(
      { id: user.id, admin: user.admin },
      privateKey
    );

    const refreshToken = generateRefreshToken(
      { id: user.id, admin: user.admin },
      privateKey
    );

    await saveRefreshToken(user.id, refreshToken);

    await KeyStoreService.createKeyStore({
      userId: user.id,
      publicKey,
      refreshToken
    });

    const userObj = user.toObject();
    const { password: _, ...safeUser } = userObj;

    return {
      user: safeUser,
      accessToken,
      refreshToken
    };
  },

  requestRefreshToken: async (refreshToken: string) => {
    const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

    let decoded: RefreshPayload;

    try {
      decoded = jwt.decode(refreshToken) as RefreshPayload;
    } catch {
      throw new AppError("INVALID_REFRESH_TOKEN", 403);
    }

    if (!decoded?.id) {
      throw new AppError("INVALID_REFRESH_TOKEN", 403);
    }

    const redisKey = `refreshToken:${decoded.id}`;
    const storedToken = await redis.get(redisKey);

    if (!storedToken || storedToken !== refreshToken) {
      await redis.del(redisKey);
      throw new AppError("INVALID_REFRESH_TOKEN", 403);
    }

    const keyStore = await KeyStoreService.findByUserId(decoded.id);
    if (!keyStore) {
      await redis.del(redisKey);
      throw new AppError("INVALID_REFRESH_TOKEN", 403);
    }

    // Verify trước, rồi mới check used
    try {
      jwt.verify(refreshToken, keyStore.publicKey);
    } catch {
      await redis.del(redisKey);
      throw new AppError("INVALID_REFRESH_TOKEN", 403);
    }

    const isUsed = await KeyStoreService.isRefreshTokenUsed(decoded.id, refreshToken);
    if (isUsed) {
      await redis.del(redisKey);
      await KeyStoreService.deleteByUserId(decoded.id);
      throw new AppError("TOKEN_REUSE_DETECTED", 403);
    }

    const newAccessToken = generateAccessToken(
      { id: decoded.id, admin: decoded.admin },
      keyStore.privateKey
    );

    const newRefreshToken = generateRefreshToken(
      { id: decoded.id, admin: decoded.admin },
      keyStore.privateKey
    );

    await redis.set(redisKey, newRefreshToken, "EX", REFRESH_TOKEN_TTL);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  },

  logout: async (userId: string) => {
    const redisKey = `refreshToken:${userId}`;
    await redis.del(redisKey);
    await KeyStoreService.deleteByUserId(userId);
  }
};