import { Request, Response } from "express";
import { ConsultationStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { easternSlotToUtc } from "../../utils/easternTime";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import { sendMail } from "../../lib/mailer";
import { consultationConfirmationEmail } from "../../emails/consultationConfirmation";
import { consultationStaffNotificationEmail } from "../../emails/consultationStaffNotification";
import { createMeetLink } from "../../lib/googleCalendar";
import * as availabilityService from "../availability/availability.service";
import * as service from "./consultations.service";

const VALID_STATUSES: ConsultationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

export const createConsultation = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      company,
      email,
      phone,
      service: svc,
      notes,
      date,
      time,
    } = req.body ?? {};

    if (!name || !email || !phone || !date || !time) {
      throw new ApiError(
        400,
        "name, email, phone, date, and time are required"
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new ApiError(400, "date must be a valid date");
    }

    const dayOfWeek = parsedDate.getUTCDay();
    const rule = await availabilityService.getRuleByDayOfWeek(dayOfWeek);
    if (!rule || !rule.timeSlots.includes(time)) {
      throw new ApiError(409, "That day/time is not available for consultations");
    }

    const slotStart = easternSlotToUtc(parsedDate, time);
    if (slotStart && slotStart.getTime() <= Date.now()) {
      throw new ApiError(409, "That time slot has already passed — please pick a future time");
    }

    const bookedTimes = await service.listBookedTimesForDate(parsedDate);
    if (bookedTimes.includes(time)) {
      throw new ApiError(409, "That time slot has just been booked — please pick another");
    }

    const meetLink = await createMeetLink({
      summary: `Aramway consultation with ${name}`,
      description: svc ? `Service: ${svc}` : undefined,
      startTime: slotStart ?? parsedDate,
    });

    const consultation = await service.createConsultation({
      name,
      company,
      email,
      phone,
      service: svc,
      notes,
      date: parsedDate,
      time,
      meetLink: meetLink ?? undefined,
    });

    res.status(201).json(consultation);

    const customerEmail = consultationConfirmationEmail({
      name: consultation.name,
      date: consultation.date,
      time: consultation.time,
      meetLink: consultation.meetLink,
      service: consultation.service,
    });
    void sendMail({ to: consultation.email, subject: customerEmail.subject, html: customerEmail.html });

    const notifyEmail = process.env.CONSULTATION_NOTIFY_EMAIL;
    if (notifyEmail) {
      const staffEmail = consultationStaffNotificationEmail({
        name: consultation.name,
        company: consultation.company,
        email: consultation.email,
        phone: consultation.phone,
        service: consultation.service,
        notes: consultation.notes,
        date: consultation.date,
        time: consultation.time,
        meetLink: consultation.meetLink,
      });
      void sendMail({ to: notifyEmail, subject: staffEmail.subject, html: staffEmail.html });
    }
  }
);

/** Public — the Aramway booking calendar checks this before letting a user pick a time. */
export const getBookedTimes = asyncHandler(async (req: Request, res: Response) => {
  const dateQuery = req.query.date as string | undefined;
  if (!dateQuery) {
    throw new ApiError(400, "date query parameter is required");
  }
  const parsedDate = new Date(dateQuery);
  if (isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "date must be a valid date");
  }

  const bookedTimes = await service.listBookedTimesForDate(parsedDate);
  res.status(200).json({ data: bookedTimes });
});

export const listConsultations = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const statusQuery = req.query.status as string | undefined;

    let status: ConsultationStatus | undefined;
    if (statusQuery) {
      if (!VALID_STATUSES.includes(statusQuery as ConsultationStatus)) {
        throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      status = statusQuery as ConsultationStatus;
    }

    const [data, total] = await service.listConsultations({
      skip,
      limit,
      status,
    });

    res.status(200).json(buildPaginatedResult(data, total, page, limit));
  }
);

export const getConsultation = asyncHandler(
  async (req: Request, res: Response) => {
    const consultation = await service.getConsultationById(req.params.id);
    if (!consultation) {
      throw new ApiError(404, "Consultation not found");
    }
    res.status(200).json(consultation);
  }
);

export const updateConsultation = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await service.getConsultationById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Consultation not found");
    }

    const { status } = req.body ?? {};
    if (status && !VALID_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const consultation = await service.updateConsultation(req.params.id, {
      status,
    });
    res.status(200).json(consultation);
  }
);

export const deleteConsultation = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await service.getConsultationById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Consultation not found");
    }
    await service.deleteConsultation(req.params.id);
    res.status(200).json({ message: "Consultation deleted" });
  }
);
