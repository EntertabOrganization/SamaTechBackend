import request from "supertest";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";

const MESSAGE = {
  id: "77777777-7777-7777-7777-777777777777",
  name: "John Smith",
  email: "john@example.com",
  phone: null,
  service: null,
  program: null,
  message: "I would like more information.",
  status: "NEW" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Contact module", () => {
  describe("POST /api/contact", () => {
    it("creates a contact message successfully", async () => {
      prismaMock.contactMessage.create.mockResolvedValue(MESSAGE as any);

      const res = await request(app).post("/api/contact").send({
        name: MESSAGE.name,
        email: MESSAGE.email,
        message: MESSAGE.message,
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(MESSAGE.name);
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await request(app).post("/api/contact").send({});
      expect(res.status).toBe(400);
      expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/contact", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).get("/api/contact");
      expect(res.status).toBe(401);
    });

    it("returns 200 with a valid cookie", async () => {
      prismaMock.contactMessage.findMany.mockResolvedValue([MESSAGE] as any);
      prismaMock.contactMessage.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/contact")
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/contact/:id", () => {
    it("returns 404 when not found", async () => {
      prismaMock.contactMessage.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/contact/${MESSAGE.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/contact/:id", () => {
    it("updates a contact message's status", async () => {
      prismaMock.contactMessage.findUnique.mockResolvedValue(MESSAGE as any);
      prismaMock.contactMessage.update.mockResolvedValue({
        ...MESSAGE,
        status: "READ",
      } as any);

      const res = await request(app)
        .patch(`/api/contact/${MESSAGE.id}`)
        .set("Cookie", authCookie())
        .send({ status: "READ" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("READ");
    });
  });

  describe("DELETE /api/contact/:id", () => {
    it("deletes a contact message", async () => {
      prismaMock.contactMessage.findUnique.mockResolvedValue(MESSAGE as any);
      prismaMock.contactMessage.delete.mockResolvedValue(MESSAGE as any);

      const res = await request(app)
        .delete(`/api/contact/${MESSAGE.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
    });
  });
});
