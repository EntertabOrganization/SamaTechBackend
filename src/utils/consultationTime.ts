/**
 * Consultation slots are published and booked in one business time zone —
 * Arabia Standard Time by default, matching the website's booking calendar
 * ("all times Arabia Standard Time (UTC+3)"). Override with CONSULTATION_TIME_ZONE
 * (any IANA zone, e.g. "America/New_York").
 */
export const CONSULTATION_TIME_ZONE = process.env.CONSULTATION_TIME_ZONE || "Asia/Riyadh";

/** Length of one consultation; the website advertises 45-minute slots. */
export const CONSULTATION_DURATION_MINUTES = 45;

const formatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Minutes the zone's wall clock is ahead of UTC at `instant` (e.g. 180 in Riyadh, -240 in EDT). */
function offsetMinutes(instant: number, timeZone: string): number {
  const parts = Object.fromEntries(
    partsFormatter(timeZone).formatToParts(new Date(instant)).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((asUtc - Math.floor(instant / 1000) * 1000) / 60000);
}

/** "09:00 AM" / "2:30 PM" / "14:30" -> { hours, minutes } in 24h, or null if unparseable. */
export function parseTimeLabel(label: string): { hours: number; minutes: number } | null {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (match[3]) {
    hours %= 12;
    if (match[3].toUpperCase() === "PM") hours += 12;
  }
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

/**
 * The UTC instant of a slot on the consultation clock. `date` carries the calendar
 * day in its UTC fields (as `new Date("2026-09-29")` does). Returns null for an
 * unparseable label.
 */
export function slotToUtc(
  date: Date,
  timeLabel: string,
  timeZone: string = CONSULTATION_TIME_ZONE
): Date | null {
  const time = parseTimeLabel(timeLabel);
  if (!time) return null;
  const wallClock = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    time.hours,
    time.minutes
  );
  // Resolve the offset twice so slots near a DST switch land on the right side of it.
  let instant = wallClock - offsetMinutes(wallClock, timeZone) * 60000;
  instant = wallClock - offsetMinutes(instant, timeZone) * 60000;
  return new Date(instant);
}

/** Human label for emails, e.g. "Arabia Standard Time" / "GMT+03:00". */
export function timeZoneLabel(date: Date, timeZone: string = CONSULTATION_TIME_ZONE): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "long" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}
