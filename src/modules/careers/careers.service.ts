import { Prisma, CareerApplicationStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface CreateCareerApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  expectedSalary: string;
  position: string;
  startDate: Date;
  resumeUrl: string;
  coverLetterUrl: string;
}

export interface UpdateCareerApplicationInput {
  status?: CareerApplicationStatus;
}

export const createCareerApplication = (data: CreateCareerApplicationInput) => {
  return prisma.careerApplication.create({ data });
};

export const listCareerApplications = (params: {
  skip: number;
  limit: number;
  status?: CareerApplicationStatus;
}) => {
  const where: Prisma.CareerApplicationWhereInput = {};
  if (params.status) where.status = params.status;

  return Promise.all([
    prisma.careerApplication.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.careerApplication.count({ where }),
  ]);
};

export const getCareerApplicationById = (id: string) => {
  return prisma.careerApplication.findUnique({ where: { id } });
};

export const updateCareerApplication = (
  id: string,
  data: UpdateCareerApplicationInput
) => {
  return prisma.careerApplication.update({ where: { id }, data });
};

export const deleteCareerApplication = (id: string) => {
  return prisma.careerApplication.delete({ where: { id } });
};
