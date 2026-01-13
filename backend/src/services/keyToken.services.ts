import KeyStore from "../models/keytoken.models";
import redis from "../config/redis.config";
import { Types } from "mongoose";

const CACHE_TTL = 60 * 10; // 10 phút

interface CreateKeyStoreInput {
  userId: string;
  publicKey: string;
  refreshToken: string;
}

export class KeyStoreService {
  private static getCacheKey(userId: string): string {
    return `keyStore:${userId}`;
  }

  private static async invalidateCache(userId: string): Promise<void> {
    await redis.del(this.getCacheKey(userId));
  }

  // Chỉ cache những field AN TOÀN: user, publicKey
  private static getSafeCacheData(keyStore: any) {
    return {
      user: keyStore.user.toString(),
      publicKey: keyStore.publicKey,
      // KHÔNG lưu refreshToken & refreshTokensUsed vào cache
      // vì chúng thay đổi thường xuyên và nhạy cảm
    };
  }

  static async createKeyStore({
    userId,
    publicKey,
    refreshToken,
  }: CreateKeyStoreInput) {
    const keyStore = await KeyStore.create({
      user: new Types.ObjectId(userId),
      publicKey,
      refreshToken,
      refreshTokensUsed: [],
    });

    // Cache chỉ phần an toàn
    const cacheKey = this.getCacheKey(userId);
    await redis.set(
      cacheKey,
      JSON.stringify(this.getSafeCacheData(keyStore)),
      "EX",
      CACHE_TTL
    );

    return keyStore;
  }

  static async findByUserId(userId: string) {
    const cacheKey = this.getCacheKey(userId);
    const cached = await redis.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached); // chỉ có user + publicKey
      } catch {
        await this.invalidateCache(userId);
      }
    }

    const keyStore = await KeyStore.findOne({
      user: new Types.ObjectId(userId),
    }).lean();

    if (!keyStore) return null;

    // Cache lại chỉ phần an toàn
    await redis.set(
      cacheKey,
      JSON.stringify(this.getSafeCacheData(keyStore)),
      "EX",
      CACHE_TTL
    );

    return keyStore; // trả về full document (có privateKey) cho service gọi
  }

  static async findByRefreshToken(refreshToken: string) {
    // Không cache vì thường dùng để kiểm tra token cũ/đã dùng
    return await KeyStore.findOne({ refreshToken }).lean();
  }

  static async updateRefreshToken(
    userId: string,
    newRefreshToken: string,
    oldRefreshToken: string
  ) {
    const updated = await KeyStore.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      {
        refreshToken: newRefreshToken,
        $push: { refreshTokensUsed: oldRefreshToken },
      },
      { new: true, lean: true }
    );

    if (updated) {
      // Cập nhật lại cache (chỉ phần an toàn)
      const cacheKey = this.getCacheKey(userId);
      await redis.set(
        cacheKey,
        JSON.stringify(this.getSafeCacheData(updated)),
        "EX",
        CACHE_TTL
      );
    } else {
      await this.invalidateCache(userId);
    }

    return updated;
  }

  static async isRefreshTokenUsed(
    userId: string,
    refreshToken: string
  ): Promise<boolean> {
    // Không dùng cache vì cần kiểm tra chính xác danh sách used
    const exists = await KeyStore.exists({
      user: new Types.ObjectId(userId),
      refreshTokensUsed: refreshToken,
    });

    return !!exists;
  }

  static async deleteByUserId(userId: string) {
    const result = await KeyStore.deleteOne({
      user: new Types.ObjectId(userId),
    });

    await this.invalidateCache(userId);
    return result;
  }
}