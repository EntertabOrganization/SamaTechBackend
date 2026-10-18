import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

// Never select passwordHash back out — user rows always go straight into API responses.
const USER_SELECT = { id: true, email: true, name: true, createdAt: true, updatedAt: true } as const;

export const createUser = async (data: CreateUserInput) => {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { email: data.email, passwordHash, name: data.name },
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
