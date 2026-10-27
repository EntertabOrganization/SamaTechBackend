import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  /** A new password; omit to keep the current one. */
  password?: string;
  /** null clears the name. */
  name?: string | null;
  role?: UserRole;
}

// Never select passwordHash back out — user rows always go straight into API responses.
const USER_SELECT = { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true } as const;

export const createUser = async (data: CreateUserInput) => {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { email: data.email, passwordHash, name: data.name, role: data.role },
    select: USER_SELECT,
  });
};

export const listUsers = (params: { skip: number; limit: number }) => {
  return Promise.all([
    prisma.user.findMany({
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: "asc" },
      select: USER_SELECT,
    }),
    prisma.user.count(),
  ]);
};

export const getUserById = (id: string) => {
  return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
};

export const countAdmins = () => {
  return prisma.user.count({ where: { role: "ADMIN" } });
};

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const { password, ...rest } = data;
  return prisma.user.update({
    where: { id },
    data: { ...rest, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
    select: USER_SELECT,
  });
};

export const deleteUser = (id: string) => {
  return prisma.user.delete({ where: { id } });
};
