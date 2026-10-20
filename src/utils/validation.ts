import { ApiError } from "./ApiError";

// Pragmatic shape check (one @, a dot in the domain, no spaces) — the
// confirmation email is the real proof that the address works.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_LENGTH = {
  short: 200,
  email: 254,
  long: 5000,
} as const;

/**
 * Reads an optional text field from a request body: trims it, treats an empty
 * string as absent, and rejects non-strings and over-long values with a 400.
 */
export function optionalText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number = MAX_LENGTH.short
): string | undefined {
  const value = body[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
}

/** Like `optionalText`, but responds 400 when the field is missing or blank. */
export function requiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number = MAX_LENGTH.short
): string {
  const value = optionalText(body, field, maxLength);
  if (!value) {
    throw new ApiError(400, `${field} is required`);
  }
  return value;
}

/**
 * Parses a "YYYY-MM-DD" calendar day into a Date at UTC midnight, rejecting
 * other formats and impossible days (e.g. 2026-02-30) with a 400.
 */
export function parseCalendarDate(value: string, field = "date"): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])) : null;
  if (!match || !date || date.getUTCMonth() !== +match[2] - 1 || date.getUTCDate() !== +match[3]) {
    throw new ApiError(400, `${field} must be a valid date in YYYY-MM-DD format`);
  }
  return date;
}

export function requiredEmail(body: Record<string, unknown>, field = "email"): string {
  const value = requiredText(body, field, MAX_LENGTH.email);
  if (!EMAIL_PATTERN.test(value)) {
    throw new ApiError(400, `${field} must be a valid email address`);
  }
  return value;
}
