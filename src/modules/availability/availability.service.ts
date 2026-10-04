import prisma from "../../lib/prisma";

export interface DayAvailability {
  dayOfWeek: number;
  timeSlots: string[];
}

/** Always returns exactly 7 entries (Sun..Sat), filling in unconfigured days as empty. */
export async function listWeeklyAvailability(): Promise<DayAvailability[]> {
  const rules = await prisma.availabilityRule.findMany({ orderBy: { dayOfWeek: "asc" } });
  const byDay = new Map(rules.map((r) => [r.dayOfWeek, r.timeSlots]));

  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    timeSlots: byDay.get(dayOfWeek) ?? [],
  }));
}

export function getRuleByDayOfWeek(dayOfWeek: number) {
  return prisma.availabilityRule.findUnique({ where: { dayOfWeek } });
}

export async function replaceWeeklyAvailability(days: DayAvailability[]): Promise<DayAvailability[]> {
  await prisma.$transaction(
    days.map((day) =>
      prisma.availabilityRule.upsert({
        where: { dayOfWeek: day.dayOfWeek },
        update: { timeSlots: day.timeSlots },
        create: { dayOfWeek: day.dayOfWeek, timeSlots: day.timeSlots },
      })
    )
  );
  return listWeeklyAvailability();
}
