import { Prisma, SubscriberStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface CreateSubscriberInput {
  email: string;
  name?: string;
}

export interface UpdateSubscriberInput {
  name?: string;
  status?: SubscriberStatus;
}

export const createSubscriber = (data: CreateSubscriberInput) => {
  return prisma.subscriber.create({ data });
};

export const listSubscribers = (params: {
  skip: number;
  limit: number;
  status?: SubscriberStatus;
}) => {
  const where: Prisma.SubscriberWhereInput = {};
  if (params.status) {
    where.status = params.status;
  }

  return Promise.all([
    prisma.subscriber.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { subscribedAt: "desc" },
    }),
    prisma.subscriber.count({ where }),
  ]);
};

export const getSubscriberById = (id: string) => {
  return prisma.subscriber.findUnique({ where: { id } });
};

/** Emails of all active (non-unsubscribed) subscribers — used for blog-published notifications. */
export const listActiveSubscriberEmails = async (): Promise<string[]> => {
  const subscribers = await prisma.subscriber.findMany({
    where: { status: "ACTIVE" },
    select: { email: true },
  });
  return subscribers.map((s) => s.email);
};

export const updateSubscriber = (id: string, data: UpdateSubscriberInput) => {
  const updateData: Prisma.SubscriberUpdateInput = { ...data };
  if (data.status === "UNSUBSCRIBED") {
    updateData.unsubscribedAt = new Date();
  }
  return prisma.subscriber.update({ where: { id }, data: updateData });
};

export const deleteSubscriber = (id: string) => {
  return prisma.subscriber.delete({ where: { id } });
};
