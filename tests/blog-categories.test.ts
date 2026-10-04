import request from "supertest";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";

const CATEGORY = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Strategy",
  slug: "strategy",
  description: "Business strategy articles",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Blog categories module", () => {
  describe("POST /api/blog-categories", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app)
        .post("/api/blog-categories")
        .send({ name: "Strategy", slug: "strategy" });
      expect(res.status).toBe(401);
    });

    it("creates a category successfully with a valid cookie", async () => {
      prismaMock.blogCategory.create.mockResolvedValue(CATEGORY as any);

      const res = await request(app)
        .post("/api/blog-categories")
        .set("Cookie", authCookie())
        .send({ name: CATEGORY.name, slug: CATEGORY.slug });

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe(CATEGORY.slug);
    });

    it("returns 400 when name/slug missing", async () => {
      const res = await request(app)
        .post("/api/blog-categories")
        .set("Cookie", authCookie())
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/blog-categories", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).get("/api/blog-categories");
      expect(res.status).toBe(401);
    });

    it("returns 200 with a valid cookie", async () => {
      prismaMock.blogCategory.findMany.mockResolvedValue([CATEGORY] as any);
      prismaMock.blogCategory.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/blog-categories")
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/blog-categories/:id", () => {
    it("returns 404 when not found", async () => {
      prismaMock.blogCategory.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/blog-categories/${CATEGORY.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/blog-categories/:id", () => {
    it("updates a category", async () => {
      prismaMock.blogCategory.findUnique.mockResolvedValue(CATEGORY as any);
      prismaMock.blogCategory.update.mockResolvedValue({
        ...CATEGORY,
        name: "Updated",
      } as any);

      const res = await request(app)
        .patch(`/api/blog-categories/${CATEGORY.id}`)
        .set("Cookie", authCookie())
        .send({ name: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated");
    });
  });

  describe("DELETE /api/blog-categories/:id", () => {
    it("deletes a category", async () => {
      prismaMock.blogCategory.findUnique.mockResolvedValue(CATEGORY as any);
      prismaMock.blogCategory.delete.mockResolvedValue(CATEGORY as any);

      const res = await request(app)
        .delete(`/api/blog-categories/${CATEGORY.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
    });
  });
});
