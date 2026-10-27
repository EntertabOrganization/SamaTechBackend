import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { signToken } from "../../utils/jwt";
import * as authService from "./auth.service";
import { requiredEmail, requiredText } from "../../utils/validation";

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In production the dashboard and the API usually sit on different sites
// (e.g. two *.vercel.app projects), and browsers only send a cross-site cookie
// with fetch() when it is SameSite=None; Secure.
const baseCookieOptions = () => {
  const production = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? ("none" as const) : ("lax" as const),
  };
};

const cookieOptions = () => ({
  ...baseCookieOptions(),
  maxAge: COOKIE_MAX_AGE_MS,
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const email = requiredEmail(body);
  requiredText(body, "password", 1024);
  // Validate the type without trimming characters from an existing password.
  const password: string = body.password;

  const user = await authService.findUserByEmail(email);
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ id: user.id, email: user.email });
  res.cookie(COOKIE_NAME, token, cookieOptions());

  res.status(200).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
  res.status(200).json({ message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Not authenticated");
  }

  const user = await authService.findUserById(req.user.id);
  if (!user) {
    throw new ApiError(401, "Not authenticated");
  }

  res.status(200).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});
