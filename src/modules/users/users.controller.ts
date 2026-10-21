import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import * as service from "./users.service";
import { optionalText, requiredEmail, requiredText } from "../../utils/validation";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const email = requiredEmail(body);
  requiredText(body, "password", 1024);
  const password: string = body.password;
  const name = optionalText(body, "name");
  if (password.length < 8) {
    throw new ApiError(400, "password must be at least 8 characters");
  }

  try {
    const user = await service.createUser({ email, password, name });
    res.status(201).json(user);
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw new ApiError(409, "A user with this email already exists");
    }
    throw err;
  }
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const [data, total] = await service.listUsers({ skip, limit });
  res.status(200).json(buildPaginatedResult(data, total, page, limit));
});
