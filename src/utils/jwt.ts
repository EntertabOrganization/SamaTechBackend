import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  email: string;
}

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
};

export const signToken = (payload: JwtPayload): string => {
  const options: SignOptions = { expiresIn: "7d" };
  return jwt.sign(payload, getSecret(), options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getSecret()) as JwtPayload;
};
