import { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import * as service from "./users.service";
import { MAX_LENGTH, optionalText, requiredEmail, requiredText } from "../../utils/validation";

const VALID_ROLES: UserRole[] = ["ADMIN", "MESSAGES", "BOOKING"];

function parseRole(value: unknown): UserRole {
  if (!VALID_ROLES.includes(value as UserRole)) {
    throw new ApiError(400, `role must be one of: ${VALID_ROLES.join(", ")}`);
  }
  return value as UserRole;
}

function checkPassword(password: string) {
  if (password.length < 8) {
    throw new ApiError(400, "password must be at least 8 characters");
  }
}

const rethrowDuplicate = (err: any): never => {
  if (err?.code === "P2002") {
    throw new ApiError(409, "A user with this email already exists");
  }
  throw err;
};

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const email = requiredEmail(body);
  requiredText(body, "password", 1024);
  const password: string = body.password;
  const name = optionalText(body, "name");
  const role = parseRole(body.role);
  checkPassword(password);

  try {
    const user = await service.createUser({ email, password, name, role });
    res.status(201).json(user);
  } catch (err) {
    rethrowDuplicate(err);
  }
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const [data, total] = await service.listUsers({ skip, limit });
  res.status(200).json(buildPaginatedResult(data, total, page, limit));
});

/** Changes any of email, name, role and password. Only the fields sent are updated. */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const existing = await service.getUserById(req.params.id);
  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  const body = req.body ?? {};
  const data: service.UpdateUserInput = {};
  if (body.email !== undefined) data.email = requiredEmail(body);
  if (body.name !== undefined) data.name = optionalText(body, "name") ?? null;
  if (body.role !== undefined) data.role = parseRole(body.role);
  if (body.password !== undefined && body.password !== "") {
    requiredText(body, "password", MAX_LENGTH.long);
    data.password = body.password;
    checkPassword(body.password);
  }

  if (existing.role === "ADMIN" && data.role && data.role !== "ADMIN") {
    if (existing.id === req.user?.id) {
      throw new ApiError(400, "You can't remove your own admin role");
    }
    if ((await service.countAdmins()) <= 1) {
      throw new ApiError(400, "At least one admin must remain");
    }
  }

  try {
    const user = await service.updateUser(existing.id, data);
    res.status(200).json(user);
  } catch (err) {
    rethrowDuplicate(err);
  }
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const existing = await service.getUserById(req.params.id);
  if (!existing) {
    throw new ApiError(404, "User not found");
  }
  if (existing.id === req.user?.id) {
    throw new ApiError(400, "You can't delete your own account");
  }
  if (existing.role === "ADMIN" && (await service.countAdmins()) <= 1) {
    throw new ApiError(400, "At least one admin must remain");
  }
  await service.deleteUser(existing.id);
  res.status(200).json({ message: "User deleted" });
});
