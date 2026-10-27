import prisma from "../../lib/prisma";

/** Email addresses are matched case-insensitively, so "admin@…" finds "Admin@…". */
export const findUserByEmail = (email: string) => {
  return prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
};

export const findUserById = (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};
