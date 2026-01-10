import redis from "../config/redis.config";

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

export const saveRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<void> => {
  await redis.set(
    `refreshToken:${userId}`,
    refreshToken,
    "EX",
    REFRESH_TOKEN_TTL
  );
    const token = await redis.get(`refreshToken:${userId}`);
    console.log("Redis refreshToken:", token);
};

export const getRefreshToken = async (
  userId: string
): Promise<string | null> => {
  return redis.get(`refreshToken:${userId}`);
};

export const deleteRefreshToken = async (
  userId: string
): Promise<void> => {
  await redis.del(`refreshToken:${userId}`);
};


