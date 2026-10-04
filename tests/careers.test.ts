import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";

const APPLICATION = {
  id: "66666666-6666-6666-6666-666666666666",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "123456789",
  address: "123 Main St",
  city: "Metropolis",
  country: "Neverland",
  expectedSalary: "5000",
  position: "Consultant",
  startDate: new Date("2026-01-01"),
  resumeUrl: "uploads/resume-test.pdf",
  coverLetterUrl: "uploads/coverLetter-test.pdf",
  status: "PENDING" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createdFiles: string[] = [];

afterAll(() => {
  for (const relativePath of createdFiles) {
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
});

describe("Careers module", () => {
  describe("POST /api/careers", () => {
    it("creates a career application successfully", async () => {
      prismaMock.careerApplication.create.mockResolvedValue(
        APPLICATION as any
      );

      const res = await request(app)
        .post("/api/careers")
        .field("firstName", "Jane")
        .field("lastName", "Doe")
        .field("email", "jane@example.com")
        .field("phone", "123456789")
        .field("address", "123 Main St")
        .field("city", "Metropolis")
        .field("country", "Neverland")
        .field("expectedSalary", "5000")
        .field("position", "Consultant")
        .field("startDate", "2026-01-01")
        .attach("resume", Buffer.from("resume content"), "resume.pdf")
        .attach("coverLetter", Buffer.from("cover content"), "cover.pdf");

      if (res.body?.resumeUrl) createdFiles.push(res.body.resumeUrl);
      if (res.body?.coverLetterUrl) createdFiles.push(res.body.coverLetterUrl);

      expect(res.status).toBe(201);
      expect(prismaMock.careerApplication.create).toHaveBeenCalledTimes(1);
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/careers")
        .field("firstName", "Jane")
        .attach("resume", Buffer.from("resume content"), "resume.pdf")
        .attach("coverLetter", Buffer.from("cover content"), "cover.pdf");

      expect(res.status).toBe(400);
      expect(prismaMock.careerApplication.create).not.toHaveBeenCalled();
    });

    it("returns 400 when files are missing", async () => {
      const res = await request(app)
        .post("/api/careers")
        .field("firstName", "Jane")
        .field("lastName", "Doe")
        .field("email", "jane@example.com")
        .field("phone", "123456789")
        .field("address", "123 Main St")
        .field("city", "Metropolis")
        .field("country", "Neverland")
        .field("expectedSalary", "5000")
        .field("position", "Consultant")
        .field("startDate", "2026-01-01");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/careers", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).get("/api/careers");
      expect(res.status).toBe(401);
    });

    it("returns 200 with a valid cookie", async () => {
      prismaMock.careerApplication.findMany.mockResolvedValue([
        APPLICATION,
      ] as any);
      prismaMock.careerApplication.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/careers")
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/careers/:id", () => {
    it("returns 404 when not found", async () => {
      prismaMock.careerApplication.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/careers/${APPLICATION.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/careers/:id", () => {
    it("updates a career application's status", async () => {
      prismaMock.careerApplication.findUnique.mockResolvedValue(
        APPLICATION as any
      );
      prismaMock.careerApplication.update.mockResolvedValue({
        ...APPLICATION,
        status: "REVIEWED",
      } as any);

      const res = await request(app)
        .patch(`/api/careers/${APPLICATION.id}`)
        .set("Cookie", authCookie())
        .send({ status: "REVIEWED" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("REVIEWED");
    });
  });

  describe("DELETE /api/careers/:id", () => {
    it("deletes a career application", async () => {
      prismaMock.careerApplication.findUnique.mockResolvedValue(
        APPLICATION as any
      );
      prismaMock.careerApplication.delete.mockResolvedValue(
        APPLICATION as any
      );

      const res = await request(app)
        .delete(`/api/careers/${APPLICATION.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
    });
  });
});
