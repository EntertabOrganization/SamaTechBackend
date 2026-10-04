import request from "supertest";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";
import { sendMail } from "../src/lib/mailer";
import { createMeetLink } from "../src/lib/googleCalendar";

jest.mock("../src/lib/mailer");
jest.mock("../src/lib/googleCalendar");
const sendMailMock = sendMail as jest.Mock;
const createMeetLinkMock = createMeetLink as jest.Mock;

// Fire-and-forget sends aren't awaited by the controller, so give their
// microtasks a turn to run before asserting on them.
const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

const CONSULTATION = {
  id: "88888888-8888-8888-8888-888888888888",
  name: "Alice Example",
  company: null,
  email: "alice@example.com",
  phone: "5551234",
  service: null,
  notes: null,
  date: new Date("2099-02-01"),
  time: "10:00",
  meetLink: "https://meet.google.com/new",
  status: "PENDING" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Consultations module", () => {
  describe("POST /api/consultations", () => {
    it("creates a consultation successfully and emails the customer plus staff notify address", async () => {
      const originalNotifyEmail = process.env.CONSULTATION_NOTIFY_EMAIL;
      process.env.CONSULTATION_NOTIFY_EMAIL = "faris@entertab.com";

      // 2099-02-01 is a Sunday (dayOfWeek 0).
      prismaMock.availabilityRule.findUnique.mockResolvedValue({
        id: "rule-0",
        dayOfWeek: 0,
        timeSlots: [CONSULTATION.time],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.consultation.findMany.mockResolvedValue([]);
      prismaMock.consultation.create.mockResolvedValue(CONSULTATION as any);

      const res = await request(app).post("/api/consultations").send({
        name: CONSULTATION.name,
        email: CONSULTATION.email,
        phone: CONSULTATION.phone,
        date: "2099-02-01",
        time: CONSULTATION.time,
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(CONSULTATION.name);

      await flushMicrotasks();
      expect(sendMailMock).toHaveBeenCalledTimes(2);
      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: CONSULTATION.email }));
      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "faris@entertab.com" }));

      process.env.CONSULTATION_NOTIFY_EMAIL = originalNotifyEmail;
    });

    it("only emails the customer when no staff notify address is configured", async () => {
      const originalNotifyEmail = process.env.CONSULTATION_NOTIFY_EMAIL;
      delete process.env.CONSULTATION_NOTIFY_EMAIL;

      prismaMock.availabilityRule.findUnique.mockResolvedValue({
        id: "rule-0",
        dayOfWeek: 0,
        timeSlots: [CONSULTATION.time],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.consultation.findMany.mockResolvedValue([]);
      prismaMock.consultation.create.mockResolvedValue(CONSULTATION as any);

      const res = await request(app).post("/api/consultations").send({
        name: CONSULTATION.name,
        email: CONSULTATION.email,
        phone: CONSULTATION.phone,
        date: "2099-02-01",
        time: CONSULTATION.time,
      });

      expect(res.status).toBe(201);
      await flushMicrotasks();
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: CONSULTATION.email }));

      process.env.CONSULTATION_NOTIFY_EMAIL = originalNotifyEmail;
    });

    it("stores and emails the real Google Meet link when Calendar integration is configured", async () => {
      const realMeetLink = "https://meet.google.com/abc-defg-hij";
      createMeetLinkMock.mockResolvedValueOnce(realMeetLink);

      prismaMock.availabilityRule.findUnique.mockResolvedValue({
        id: "rule-0",
        dayOfWeek: 0,
        timeSlots: [CONSULTATION.time],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.consultation.findMany.mockResolvedValue([]);
      prismaMock.consultation.create.mockResolvedValue({ ...CONSULTATION, meetLink: realMeetLink } as any);

      const res = await request(app).post("/api/consultations").send({
        name: CONSULTATION.name,
        email: CONSULTATION.email,
        phone: CONSULTATION.phone,
        date: "2099-02-01",
        time: CONSULTATION.time,
      });

      expect(res.status).toBe(201);
      expect(res.body.meetLink).toBe(realMeetLink);
      expect(prismaMock.consultation.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ meetLink: realMeetLink }) })
      );
    });

    it("falls back to the default meet link when Calendar integration isn't configured", async () => {
      createMeetLinkMock.mockResolvedValueOnce(null);

      prismaMock.availabilityRule.findUnique.mockResolvedValue({
        id: "rule-0",
        dayOfWeek: 0,
        timeSlots: [CONSULTATION.time],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.consultation.findMany.mockResolvedValue([]);
      prismaMock.consultation.create.mockResolvedValue(CONSULTATION as any);

      const res = await request(app).post("/api/consultations").send({
        name: CONSULTATION.name,
        email: CONSULTATION.email,
        phone: CONSULTATION.phone,
        date: "2099-02-01",
        time: CONSULTATION.time,
      });

      expect(res.status).toBe(201);
      expect(prismaMock.consultation.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ meetLink: undefined }) })
      );
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await request(app).post("/api/consultations").send({});
      expect(res.status).toBe(400);
      expect(prismaMock.consultation.create).not.toHaveBeenCalled();
    });

    it("returns 409 when the day/time isn't in the admin's availability", async () => {
      prismaMock.availabilityRule.findUnique.mockResolvedValue(null);

      const res = await request(app).post("/api/consultations").send({
        name: CONSULTATION.name,
        email: CONSULTATION.email,
        phone: CONSULTATION.phone,
        date: "2099-02-01",
        time: CONSULTATION.time,
      });

      expect(res.status).toBe(409);
      expect(prismaMock.consultation.create).not.toHaveBeenCalled();
    });

    it("returns 409 when the slot has already passed in Eastern Time", async () => {
      prismaMock.availabilityRule.findUnique.mockResolvedValue({
        id: "rule-0",
        dayOfWeek: 0,
        timeSlots: ["09:00 AM"],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.consultation.findMany.mockResolvedValue([]);

      const res = await request(app).post("/api/consultations").send({
        name: CONSULTATION.name,
        email: CONSULTATION.email,
        phone: CONSULTATION.phone,
        date: "2026-02-01",
        time: "09:00 AM",
      });

      expect(res.status).toBe(409);
      expect(prismaMock.consultation.create).not.toHaveBeenCalled();
    });

    it("returns 409 when the slot is already booked", async () => {
      prismaMock.availabilityRule.findUnique.mockResolvedValue({
        id: "rule-0",
        dayOfWeek: 0,
        timeSlots: [CONSULTATION.time],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.consultation.findMany.mockResolvedValue([CONSULTATION] as any);

      const res = await request(app).post("/api/consultations").send({
        name: CONSULTATION.name,
        email: CONSULTATION.email,
        phone: CONSULTATION.phone,
        date: "2099-02-01",
        time: CONSULTATION.time,
      });

      expect(res.status).toBe(409);
      expect(prismaMock.consultation.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/consultations/booked", () => {
    it("returns 400 without a date", async () => {
      const res = await request(app).get("/api/consultations/booked");
      expect(res.status).toBe(400);
    });

    it("returns booked times for a date without requiring a cookie", async () => {
      prismaMock.consultation.findMany.mockResolvedValue([CONSULTATION] as any);

      const res = await request(app).get("/api/consultations/booked?date=2099-02-01");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([CONSULTATION.time]);
    });
  });

  describe("GET /api/consultations", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).get("/api/consultations");
      expect(res.status).toBe(401);
    });

    it("returns 200 with a valid cookie", async () => {
      prismaMock.consultation.findMany.mockResolvedValue([
        CONSULTATION,
      ] as any);
      prismaMock.consultation.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/consultations")
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/consultations/:id", () => {
    it("returns 404 when not found", async () => {
      prismaMock.consultation.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/consultations/${CONSULTATION.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/consultations/:id", () => {
    it("updates a consultation's status", async () => {
      prismaMock.consultation.findUnique.mockResolvedValue(
        CONSULTATION as any
      );
      prismaMock.consultation.update.mockResolvedValue({
        ...CONSULTATION,
        status: "CONFIRMED",
      } as any);

      const res = await request(app)
        .patch(`/api/consultations/${CONSULTATION.id}`)
        .set("Cookie", authCookie())
        .send({ status: "CONFIRMED" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("CONFIRMED");
    });
  });

  describe("DELETE /api/consultations/:id", () => {
    it("deletes a consultation", async () => {
      prismaMock.consultation.findUnique.mockResolvedValue(
        CONSULTATION as any
      );
      prismaMock.consultation.delete.mockResolvedValue(CONSULTATION as any);

      const res = await request(app)
        .delete(`/api/consultations/${CONSULTATION.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
    });
  });
});
