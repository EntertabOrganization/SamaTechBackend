import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export interface AdminPayload {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

/**
 * Reads the httpOnly `token` cookie, verifies the JWT, and attaches
 * `req.admin = { id, email }`. Responds 401 if missing/invalid.
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.admin = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
