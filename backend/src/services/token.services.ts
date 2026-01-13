import jwt, { SignOptions } from "jsonwebtoken"

interface TokenPayload {
    id: string;
    admin: boolean;
}

export const generateAccessToken = (
  payload: TokenPayload,
  privateKey: string
): string => {
  const options: SignOptions = {
    expiresIn: "30s"
  };

  return jwt.sign(payload, privateKey, options);
};

export const generateRefreshToken = (
  payload: TokenPayload,
  privateKey: string
): string => {
  const options: SignOptions = {
    expiresIn: "7d"
  };

  return jwt.sign(payload, privateKey, options);
};