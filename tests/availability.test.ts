import request from "supertest";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";

function ruleRow(dayOfWeek: number, timeSlots: string[]) {
  return { id: `rule-${dayOfWeek}`, dayOfWeek, timeSlots, createdAt: new Date(), updatedAt: new Date() };
}

describe("Availability module", () => {
  describe("GET /api/availability", () => {
    it("returns 200 without a cookie, with exactly 7 days", async () => {
      prismaMock.availabilityRule.findMany.mockResolvedValue([
        ruleRow(1, ["09:00 AM", "10:00 AM"]),
        ruleRow(3, ["02:00 PM"]),
      ] as any);

      const res = await request(app).get("/api/availability");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(7);
      expect(res.body.data[1]).toEqual({ dayOfWeek: 1, timeSlots: ["09:00 AM", "10:00 AM"] });
      expect(res.body.data[0]).toEqual({ dayOfWeek: 0, timeSlots: [] });
    });
  });

  describe("PUT /api/availability", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).put("/api/availability").send({ days: [] });
      expect(res.status).toBe(401);
    });

    it("returns 400 for a malformed payload", async () => {
      const res = await request(app)
        .put("/api/availability")
        .set("Cookie", authCookie())
        .send({ days: [{ dayOfWeek: 0, timeSlots: ["09:00 AM"] }] }); // only 1 of 7 days

      expect(res.status).toBe(400);
    });

    it("replaces the weekly schedule with a valid cookie", async () => {
      const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        timeSlots: dayOfWeek >= 1 && dayOfWeek <= 5 ? ["09:00 AM", "10:00 AM"] : [],
      }));
      prismaMock.$transaction.mockResolvedValue(days.map((d) => ruleRow(d.dayOfWeek, d.timeSlots)) as any);
      prismaMock.availabilityRule.findMany.mockResolvedValue(days.map((d) => ruleRow(d.dayOfWeek, d.timeSlots)) as any);

      const res = await request(app).put("/api/availability").set("Cookie", authCookie()).send({ days });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(7);
      expect(res.body.data[1].timeSlots).toEqual(["09:00 AM", "10:00 AM"]);
    });
  });
});
