import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { parseTimeLabel } from "../../utils/consultationTime";
import * as service from "./availability.service";

function isValidDaysPayload(body: unknown): body is service.DayAvailability[] {
  if (!Array.isArray(body) || body.length !== 7) return false;
  const seenDays = new Set<number>();
  return body.every((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.dayOfWeek !== "number" ||
      !Number.isInteger(entry.dayOfWeek) ||
      entry.dayOfWeek < 0 ||
      entry.dayOfWeek > 6 ||
      seenDays.has(entry.dayOfWeek) ||
      !Array.isArray(entry.timeSlots) ||
      !entry.timeSlots.every((slot: unknown) => typeof slot === "string" && parseTimeLabel(slot) !== null)
    ) {
      return false;
    }
    seenDays.add(entry.dayOfWeek);
    return true;
  });
}

/** Public — the SamaTechs booking calendar reads this to know which days/times are open. */
export const getWeeklyAvailability = asyncHandler(async (_req: Request, res: Response) => {
  const days = await service.listWeeklyAvailability();
  res.status(200).json({ data: days });
});

/** Protected — the user sets their recurring weekly schedule from the dashboard. */
export const updateWeeklyAvailability = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body?.days;

  if (!isValidDaysPayload(body)) {
    throw new ApiError(
      400,
      "days must be an array of exactly 7 entries, one per dayOfWeek (0-6), each with a timeSlots array of times such as \"09:00\" or \"02:30 PM\""
    );
  }

  const days = await service.replaceWeeklyAvailability(body);
  res.status(200).json({ data: days });
});

/** Protected — closes every day for booking. */
export const clearWeeklyAvailability = asyncHandler(async (_req: Request, res: Response) => {
  const days = await service.clearWeeklyAvailability();
  res.status(200).json({ data: days });
});
