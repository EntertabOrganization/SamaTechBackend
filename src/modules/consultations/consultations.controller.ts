import { Request, Response } from "express";
import { ConsultationStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { CONSULTATION_DURATION_MINUTES, parseTimeLabel, slotToUtc } from "../../utils/consultationTime";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import {
  MAX_LENGTH,
  optionalText,
  parseCalendarDate,
  requiredEmail,
  requiredText,
} from "../../utils/validation";
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
    const body = req.body ?? {};
    const name = requiredText(body, "name");
    const email = requiredEmail(body);
    const company = optionalText(body, "company");
    const phone = optionalText(body, "phone", 50);
    const svc = optionalText(body, "service");
    const notes = optionalText(body, "notes", MAX_LENGTH.long);
    const date = requiredText(body, "date", 10);
    const time = requiredText(body, "time", 20);

    const parsedDate = parseCalendarDate(date);

    const dayOfWeek = parsedDate.getUTCDay();
    const rule = await availabilityService.getRuleByDayOfWeek(dayOfWeek);
    if (!rule || !rule.timeSlots.includes(time)) {
      throw new ApiError(409, "That day/time is not available for consultations");
    }

    const slotStart = slotToUtc(parsedDate, time);
    if (slotStart && slotStart.getTime() <= Date.now()) {
      throw new ApiError(409, "That time slot has already passed — please pick a future time");
    }

    const bookedTimes = await service.listBookedTimesForDate(parsedDate);
    if (bookedTimes.includes(time)) {
      throw new ApiError(409, "That time slot has just been booked — please pick another");
    }

    const meetLink = await createMeetLink({
      summary: `SAMATECHS consultation with ${name}`,
      description: svc ? `Service: ${svc}` : undefined,
      startTime: slotStart ?? parsedDate,
      durationMinutes: CONSULTATION_DURATION_MINUTES,
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
      void sendMail({
        to: notifyEmail,
        subject: staffEmail.subject,
        html: staffEmail.html,
        replyTo: consultation.email,
      });
    }
  }
);

/** Public — the SamaTechs booking calendar checks this before letting a user pick a time. */
export const getBookedTimes = asyncHandler(async (req: Request, res: Response) => {
  const dateQuery = req.query.date as string | undefined;
  if (!dateQuery) {
    throw new ApiError(400, "date query parameter is required");
  }
  const parsedDate = parseCalendarDate(dateQuery);

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

    const body = req.body ?? {};
    const data: service.UpdateConsultationInput = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      data.status = body.status;
    }
    if (body.name !== undefined) data.name = requiredText(body, "name");
    if (body.email !== undefined) data.email = requiredEmail(body);
    if (body.company !== undefined) data.company = optionalText(body, "company") ?? null;
    if (body.phone !== undefined) data.phone = optionalText(body, "phone", 50) ?? null;
    if (body.service !== undefined) data.service = optionalText(body, "service") ?? null;
    if (body.notes !== undefined) data.notes = optionalText(body, "notes", MAX_LENGTH.long) ?? null;
    if (body.meetLink !== undefined) {
      const meetLink = requiredText(body, "meetLink", 500);
      if (!/^https?:\/\/\S+$/i.test(meetLink)) {
        throw new ApiError(400, "meetLink must be an http(s) URL");
      }
      data.meetLink = meetLink;
    }
    if (body.date !== undefined) data.date = parseCalendarDate(requiredText(body, "date", 10));
    if (body.time !== undefined) {
      const time = requiredText(body, "time", 20);
      if (!parseTimeLabel(time)) {
        throw new ApiError(400, "time must look like \"09:00\" or \"02:30 PM\"");
      }
      data.time = time;
    }

    // Staff may move a booking to any time, but not onto another live booking.
    const status = data.status ?? existing.status;
    const moved = data.date !== undefined || data.time !== undefined;
    if ((moved || data.status) && (status === "PENDING" || status === "CONFIRMED")) {
      const date = data.date ?? existing.date;
      const time = data.time ?? existing.time;
      const bookedTimes = await service.listBookedTimesForDate(date, existing.id);
      if (bookedTimes.includes(time)) {
        throw new ApiError(409, "Another booking already holds that date and time");
      }
    }

    const consultation = await service.updateConsultation(existing.id, data);
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
