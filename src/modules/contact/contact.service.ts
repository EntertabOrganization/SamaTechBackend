import { Prisma, ContactMessageStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface CreateContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  program?: string;
  message: string;
}

export interface UpdateContactMessageInput {
  status?: ContactMessageStatus;
}

export const createContactMessage = (data: CreateContactMessageInput) => {
  return prisma.contactMessage.create({ data });
};

export const listContactMessages = (params: {
  skip: number;
  limit: number;
  status?: ContactMessageStatus;
}) => {
  const where: Prisma.ContactMessageWhereInput = {};
  if (params.status) where.status = params.status;

  return Promise.all([
    prisma.contactMessage.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactMessage.count({ where }),
  ]);
};

export const getContactMessageById = (id: string) => {
  return prisma.contactMessage.findUnique({ where: { id } });
};

export const updateContactMessage = (
  id: string,
  data: UpdateContactMessageInput
) => {
  return prisma.contactMessage.update({ where: { id }, data });
};

export const deleteContactMessage = (id: string) => {
  return prisma.contactMessage.delete({ where: { id } });
};
