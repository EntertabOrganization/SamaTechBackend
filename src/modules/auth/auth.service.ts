import prisma from "../../lib/prisma";

export const findAdminByEmail = (email: string) => {
  return prisma.admin.findUnique({ where: { email } });
};

export const findAdminById = (id: string) => {
  return prisma.admin.findUnique({ where: { id } });
};
