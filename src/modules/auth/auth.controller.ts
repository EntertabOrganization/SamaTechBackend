import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { signToken } from "../../utils/jwt";
import * as authService from "./auth.service";

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
});

const cookieOptions = () => ({
  ...baseCookieOptions(),
  maxAge: COOKIE_MAX_AGE_MS,
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const admin = await authService.findAdminByEmail(email);
  if (!admin) {
    throw new ApiError(401, "Invalid email or password");
  }

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ id: admin.id, email: admin.email });
  res.cookie(COOKIE_NAME, token, cookieOptions());

  res.status(200).json({
    admin: { id: admin.id, email: admin.email, name: admin.name },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
  res.status(200).json({ message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) {
    throw new ApiError(401, "Not authenticated");
  }

  const admin = await authService.findAdminById(req.admin.id);
  if (!admin) {
    throw new ApiError(401, "Not authenticated");
  }

  res.status(200).json({
    admin: { id: admin.id, email: admin.email, name: admin.name },
  });
});
