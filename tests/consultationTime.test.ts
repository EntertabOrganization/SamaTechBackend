import { parseTimeLabel, slotToUtc, timeZoneLabel } from "../src/utils/consultationTime";

describe("consultationTime utils", () => {
  it("parses 12h and 24h labels", () => {
    expect(parseTimeLabel("09:00 AM")).toEqual({ hours: 9, minutes: 0 });
    expect(parseTimeLabel("12:30 PM")).toEqual({ hours: 12, minutes: 30 });
    expect(parseTimeLabel("12:00 AM")).toEqual({ hours: 0, minutes: 0 });
    expect(parseTimeLabel("14:15")).toEqual({ hours: 14, minutes: 15 });
    expect(parseTimeLabel("noon")).toBeNull();
    expect(parseTimeLabel("25:00")).toBeNull();
  });

  it("converts slots to UTC in Arabia Standard Time by default", () => {
    expect(slotToUtc(new Date("2026-11-01"), "09:00")?.toISOString()).toBe("2026-11-01T06:00:00.000Z");
    expect(slotToUtc(new Date("2026-11-01"), "02:00 PM")?.toISOString()).toBe("2026-11-01T11:00:00.000Z");
    expect(slotToUtc(new Date("2026-11-01"), "later")).toBeNull();
  });

  it("converts slots to UTC across DST in other zones", () => {
    const zone = "America/New_York";
    // EDT (UTC-4)
    expect(slotToUtc(new Date("2026-09-29"), "09:00 AM", zone)?.toISOString()).toBe("2026-09-29T13:00:00.000Z");
    // EST (UTC-5)
    expect(slotToUtc(new Date("2026-12-01"), "02:00 PM", zone)?.toISOString()).toBe("2026-12-01T19:00:00.000Z");
    // Day DST ends (Nov 1 2026): 9 AM is already EST
    expect(slotToUtc(new Date("2026-11-01"), "09:00 AM", zone)?.toISOString()).toBe("2026-11-01T14:00:00.000Z");
    // Day DST starts (Mar 8 2026): 9 AM is already EDT
    expect(slotToUtc(new Date("2026-03-08"), "09:00 AM", zone)?.toISOString()).toBe("2026-03-08T13:00:00.000Z");
  });

  it("names the time zone for emails", () => {
    expect(timeZoneLabel(new Date("2026-11-01"))).toMatch(/Arabia/);
  });
});
