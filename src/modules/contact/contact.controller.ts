import { Request, Response } from "express";
import { ContactMessageStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import * as service from "./contact.service";

const VALID_STATUSES: ContactMessageStatus[] = ["NEW", "READ", "RESPONDED"];

export const createContactMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, phone, service: svc, program, message } = req.body ?? {};

    if (!name || !email || !message) {
      throw new ApiError(400, "name, email, and message are required");
    }

    const contactMessage = await service.createContactMessage({
      name,
      email,
      phone,
      service: svc,
      program,
      message,
    });

    res.status(201).json(contactMessage);
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
