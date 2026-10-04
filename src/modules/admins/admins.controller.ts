import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import * as service from "./admins.service";

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "password must be at least 8 characters");
  }

  try {
    const admin = await service.createAdmin({ email, password, name });
    res.status(201).json(admin);
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw new ApiError(409, "An admin with this email already exists");
    }
    throw err;
  }
});

export const listAdmins = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const [data, total] = await service.listAdmins({ skip, limit });
  res.status(200).json(buildPaginatedResult(data, total, page, limit));
});
