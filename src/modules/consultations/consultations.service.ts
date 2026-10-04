import { Prisma, ConsultationStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface CreateConsultationInput {
  name: string;
  company?: string;
  email: string;
  phone: string;
  service?: string;
  notes?: string;
  date: Date;
  time: string;
  /** Omit to fall back to the schema default (a static, non-shared placeholder link). */
  meetLink?: string;
}

export interface UpdateConsultationInput {
  status?: ConsultationStatus;
}

export const createConsultation = (data: CreateConsultationInput) => {
  return prisma.consultation.create({ data });
};

export const listConsultations = (params: {
  skip: number;
  limit: number;
  status?: ConsultationStatus;
}) => {
  const where: Prisma.ConsultationWhereInput = {};
  if (params.status) where.status = params.status;

  return Promise.all([
    prisma.consultation.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultation.count({ where }),
  ]);
};

export const getConsultationById = (id: string) => {
  return prisma.consultation.findUnique({ where: { id } });
};

/** Time slots already taken on a given day — PENDING/CONFIRMED bookings only; CANCELLED frees the slot back up. */
export const listBookedTimesForDate = async (date: Date): Promise<string[]> => {
  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const consultations = await prisma.consultation.findMany({
    where: {
      date: { gte: startOfDay, lt: endOfDay },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { time: true },
  });
  return consultations.map((c) => c.time);
};

export const updateConsultation = (
  id: string,
  data: UpdateConsultationInput
) => {
  return prisma.consultation.update({ where: { id }, data });
};

export const deleteConsultation = (id: string) => {
  return prisma.consultation.delete({ where: { id } });
};
