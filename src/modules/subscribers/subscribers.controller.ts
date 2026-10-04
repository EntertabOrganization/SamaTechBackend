import { Request, Response } from "express";
import { SubscriberStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import { sendMail } from "../../lib/mailer";
import { subscriptionConfirmationEmail } from "../../emails/subscriptionConfirmation";
import * as subscribersService from "./subscribers.service";

const VALID_STATUSES: SubscriberStatus[] = ["ACTIVE", "UNSUBSCRIBED"];

export const createSubscriber = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, name } = req.body ?? {};

    if (!email || typeof email !== "string") {
      throw new ApiError(400, "email is required");
    }

    try {
      const subscriber = await subscribersService.createSubscriber({
        email,
        name,
      });
      res.status(201).json(subscriber);

      const { subject, html } = subscriptionConfirmationEmail({ name });
      void sendMail({ to: subscriber.email, subject, html });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ApiError(409, "This email is already subscribed");
      }
      throw err;
    }
  }
);

export const listSubscribers = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const statusQuery = req.query.status as string | undefined;

    let status: SubscriberStatus | undefined;
    if (statusQuery) {
      if (!VALID_STATUSES.includes(statusQuery as SubscriberStatus)) {
        throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      status = statusQuery as SubscriberStatus;
    }

    const [data, total] = await subscribersService.listSubscribers({
      skip,
      limit,
      status,
    });

    res.status(200).json(buildPaginatedResult(data, total, page, limit));
  }
);

export const getSubscriber = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriber = await subscribersService.getSubscriberById(
      req.params.id
    );
    if (!subscriber) {
      throw new ApiError(404, "Subscriber not found");
    }
    res.status(200).json(subscriber);
  }
);

export const updateSubscriber = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await subscribersService.getSubscriberById(
      req.params.id
    );
    if (!existing) {
      throw new ApiError(404, "Subscriber not found");
    }

    const { name, status } = req.body ?? {};
    if (status && !VALID_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const subscriber = await subscribersService.updateSubscriber(
      req.params.id,
      { name, status }
    );
    res.status(200).json(subscriber);
  }
);

export const deleteSubscriber = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await subscribersService.getSubscriberById(
      req.params.id
    );
    if (!existing) {
      throw new ApiError(404, "Subscriber not found");
    }

    await subscribersService.deleteSubscriber(req.params.id);
    res.status(200).json({ message: "Subscriber deleted" });
  }
);
