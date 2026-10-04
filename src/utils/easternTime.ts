/** Consultation slots are published and booked in US Eastern Time. */
export const CONSULTATION_TIME_ZONE = "America/New_York";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CONSULTATION_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Minutes the Eastern wall clock is ahead of UTC at `instant` (-300 in EST, -240 in EDT). */
function easternOffsetMinutes(instant: number): number {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(instant)).map((p) => [p.type, p.value])
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
 * The UTC instant of an Eastern-Time slot. `date` carries the calendar day in its
 * UTC fields (as `new Date("2026-09-29")` does). Returns null for an unparseable label.
 */
export function easternSlotToUtc(date: Date, timeLabel: string): Date | null {
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
  let instant = wallClock - easternOffsetMinutes(wallClock) * 60000;
  instant = wallClock - easternOffsetMinutes(instant) * 60000;
  return new Date(instant);
}
