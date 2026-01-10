import jwt from "jsonwebtoken"

interface TokenPayload {
    id: string;
    admin: boolean;
}

export const generateAccessToken = (payload: TokenPayload) => {
    return jwt.sign (
        payload,
        process.env.JWT_ACCESS_KEY as string,
        {expiresIn: "30s"}
    )
}

export const generateRefreshToken = (payload: TokenPayload) => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_KEY as string,
        {expiresIn: "7d"}
    )
}
