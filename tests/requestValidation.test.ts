import request from "supertest";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";

describe("Request validation", () => {
  it.each([
    { email: { value: "user@example.com" }, password: "password123" },
    { email: "not-an-email", password: "password123" },
    { email: "user@example.com", password: { value: "password123" } },
  ])("rejects malformed login fields before querying the database: %j", async (body) => {
    const response = await request(app).post("/api/auth/login").send(body);
    expect(response.status).toBe(400);
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it.each([
    { email: "not-an-email", password: "password123" },
    { email: "user@example.com", password: { value: "password123" } },
    { email: "user@example.com", password: "password123", name: [] },
  ])("rejects malformed user fields before creating an account: %j", async (body) => {
    const response = await request(app).post("/api/users").set("Cookie", authCookie()).send(body);
    expect(response.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects fractional weekdays without replacing availability", async () => {
    const days = Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index === 0 ? 0.5 : index,
      timeSlots: [],
    }));
    const response = await request(app).put("/api/availability").set("Cookie", authCookie()).send({ days });
    expect(response.status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns a JSON client error for malformed JSON", async () => {
    const response = await request(app).post("/api/contact").type("json").send("{");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Request body must be valid JSON");
    expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
  });

  it("returns 413 for an oversized body", async () => {
    const response = await request(app).post("/api/contact").send({ message: "x".repeat(110_000) });
    expect(response.status).toBe(413);
    expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
  });
});
