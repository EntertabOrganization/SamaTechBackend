import { Request, Response } from "express";
import { ContactMessageStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import { MAX_LENGTH, optionalText, requiredEmail, requiredText } from "../../utils/validation";
import { sendMail } from "../../lib/mailer";
import { contactStaffNotificationEmail } from "../../emails/contactStaffNotification";
import * as service from "./contact.service";

const VALID_STATUSES: ContactMessageStatus[] = ["NEW", "READ", "RESPONDED"];

export const createContactMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body ?? {};

    const contactMessage = await service.createContactMessage({
      name: requiredText(body, "name"),
      email: requiredEmail(body),
      organization: optionalText(body, "organization"),
      jobTitle: optionalText(body, "jobTitle"),
      phone: optionalText(body, "phone", 50),
      service: optionalText(body, "service"),
      program: optionalText(body, "program"),
      message: requiredText(body, "message", MAX_LENGTH.long),
    });

    res.status(201).json(contactMessage);

    const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL || process.env.CONSULTATION_NOTIFY_EMAIL;
    if (notifyEmail) {
      const staffEmail = contactStaffNotificationEmail(contactMessage);
      void sendMail({
        to: notifyEmail,
        subject: staffEmail.subject,
        html: staffEmail.html,
        replyTo: contactMessage.email,
      });
    }
  }
);

export const listContactMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const statusQuery = req.query.status as string | undefined;

    let status: ContactMessageStatus | undefined;
    if (statusQuery) {
      if (!VALID_STATUSES.includes(statusQuery as ContactMessageStatus)) {
        throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      status = statusQuery as ContactMessageStatus;
    }

    const [data, total] = await service.listContactMessages({
      skip,
      limit,
      status,
    });

    res.status(200).json(buildPaginatedResult(data, total, page, limit));
  }
);

export const getContactMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const contactMessage = await service.getContactMessageById(req.params.id);
    if (!contactMessage) {
      throw new ApiError(404, "Contact message not found");
    }
    res.status(200).json(contactMessage);
  }
);

export const updateContactMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await service.getContactMessageById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Contact message not found");
    }

    const { status } = req.body ?? {};
    if (status && !VALID_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const contactMessage = await service.updateContactMessage(req.params.id, {
      status,
    });
    res.status(200).json(contactMessage);
  }
);

export const deleteContactMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await service.getContactMessageById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Contact message not found");
    }
    await service.deleteContactMessage(req.params.id);
    res.status(200).json({ message: "Contact message deleted" });
  }
);
