import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie, TEST_ADMIN } from "./utils/testAuth";

describe("Auth module", () => {
  describe("POST /api/auth/login", () => {
    it("logs in successfully with correct credentials and sets a cookie", async () => {
      const passwordHash = await bcrypt.hash("Admin@1234", 10);
      prismaMock.admin.findUnique.mockResolvedValue({
        id: TEST_ADMIN.id,
        email: TEST_ADMIN.email,
        passwordHash,
        name: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_ADMIN.email, password: "Admin@1234" });

      expect(res.status).toBe(200);
      expect(res.body.admin.email).toBe(TEST_ADMIN.email);
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toMatch(/token=/);
    });

    it("returns 401 for wrong password", async () => {
      const passwordHash = await bcrypt.hash("Admin@1234", 10);
      prismaMock.admin.findUnique.mockResolvedValue({
        id: TEST_ADMIN.id,
        email: TEST_ADMIN.email,
        passwordHash,
        name: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_ADMIN.email, password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("returns 401 for unknown email", async () => {
      prismaMock.admin.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@example.com", password: "Admin@1234" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("returns 400 when email or password is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 200 with a valid cookie", async () => {
      prismaMock.admin.findUnique.mockResolvedValue({
        id: TEST_ADMIN.id,
        email: TEST_ADMIN.email,
        passwordHash: "hash",
        name: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.admin.email).toBe(TEST_ADMIN.email);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(401);
    });

    it("clears the cookie with a valid cookie", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"][0]).toMatch(/token=;/);
    });
  });
});
