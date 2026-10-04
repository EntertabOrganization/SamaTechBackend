import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";

export interface CreateAdminInput {
  email: string;
  password: string;
  name?: string;
}

// Never select passwordHash back out — admin rows always go straight into API responses.
const ADMIN_SELECT = { id: true, email: true, name: true, createdAt: true, updatedAt: true } as const;

export const createAdmin = async (data: CreateAdminInput) => {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.admin.create({
    data: { email: data.email, passwordHash, name: data.name },
    select: ADMIN_SELECT,
  });
};

export const listAdmins = (params: { skip: number; limit: number }) => {
  return Promise.all([
    prisma.admin.findMany({
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: "asc" },
      select: ADMIN_SELECT,
    }),
    prisma.admin.count(),
  ]);
};
