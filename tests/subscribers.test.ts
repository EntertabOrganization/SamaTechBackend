import request from "supertest";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";

const SUBSCRIBER = {
  id: "22222222-2222-2222-2222-222222222222",
  email: "subscriber@example.com",
  name: "Jane Doe",
  status: "ACTIVE" as const,
  subscribedAt: new Date(),
  unsubscribedAt: null,
};

describe("Subscribers module", () => {
  describe("POST /api/subscribers", () => {
    it("creates a subscriber successfully", async () => {
      prismaMock.subscriber.create.mockResolvedValue(SUBSCRIBER as any);

      const res = await request(app)
        .post("/api/subscribers")
        .send({ email: SUBSCRIBER.email, name: SUBSCRIBER.name });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe(SUBSCRIBER.email);
      expect(prismaMock.subscriber.create).toHaveBeenCalledTimes(1);
    });

    it("returns 400 when email is missing", async () => {
      const res = await request(app).post("/api/subscribers").send({});
      expect(res.status).toBe(400);
      expect(prismaMock.subscriber.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/subscribers", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).get("/api/subscribers");
      expect(res.status).toBe(401);
    });

    it("returns 200 with a valid cookie", async () => {
      prismaMock.subscriber.findMany.mockResolvedValue([SUBSCRIBER] as any);
      prismaMock.subscriber.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/subscribers")
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe("GET /api/subscribers/:id", () => {
    it("returns 404 when not found", async () => {
      prismaMock.subscriber.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/subscribers/${SUBSCRIBER.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/subscribers/:id", () => {
    it("updates a subscriber", async () => {
      prismaMock.subscriber.findUnique.mockResolvedValue(SUBSCRIBER as any);
      prismaMock.subscriber.update.mockResolvedValue({
        ...SUBSCRIBER,
        name: "Updated Name",
      } as any);

      const res = await request(app)
        .patch(`/api/subscribers/${SUBSCRIBER.id}`)
        .set("Cookie", authCookie())
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
    });
  });

  describe("DELETE /api/subscribers/:id", () => {
    it("deletes a subscriber", async () => {
      prismaMock.subscriber.findUnique.mockResolvedValue(SUBSCRIBER as any);
      prismaMock.subscriber.delete.mockResolvedValue(SUBSCRIBER as any);

      const res = await request(app)
        .delete(`/api/subscribers/${SUBSCRIBER.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
    });
  });
});
