import request from "supertest";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";

const CATEGORY = {
  id: "44444444-4444-4444-4444-444444444444",
  name: "Strategy",
  slug: "strategy",
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const BLOG = {
  id: "55555555-5555-5555-5555-555555555555",
  title: "Growth in 2026",
  slug: "growth-in-2026",
  excerpt: "excerpt",
  content: "content",
  coverImage: null,
  type: "BLOG" as const,
  status: "DRAFT" as const,
  tags: ["growth"],
  categoryId: CATEGORY.id,
  authorName: null,
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PUBLISHED_BLOG = {
  ...BLOG,
  id: "66666666-6666-6666-6666-666666666666",
  slug: "published-growth-2026",
  status: "PUBLISHED" as const,
};

describe("Blogs module", () => {
  describe("GET /api/blogs/public", () => {
    it("returns 200 without a cookie", async () => {
      prismaMock.blog.findMany.mockResolvedValue([PUBLISHED_BLOG] as any);
      prismaMock.blog.count.mockResolvedValue(1);

      const res = await request(app).get("/api/blogs/public");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("only queries published blogs, ignoring a status override", async () => {
      prismaMock.blog.findMany.mockResolvedValue([]);
      prismaMock.blog.count.mockResolvedValue(0);

      await request(app).get("/api/blogs/public?status=DRAFT");

      expect(prismaMock.blog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED" }) })
      );
    });

    it("returns 400 for an invalid type filter", async () => {
      const res = await request(app).get("/api/blogs/public?type=INVALID");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/blogs/public/:slug", () => {
    it("returns 200 for a published blog", async () => {
      prismaMock.blog.findUnique.mockResolvedValue(PUBLISHED_BLOG as any);

      const res = await request(app).get(`/api/blogs/public/${PUBLISHED_BLOG.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe(PUBLISHED_BLOG.slug);
    });

    it("returns 404 for a draft blog", async () => {
      prismaMock.blog.findUnique.mockResolvedValue(BLOG as any);

      const res = await request(app).get(`/api/blogs/public/${BLOG.slug}`);

      expect(res.status).toBe(404);
    });

    it("returns 404 when not found", async () => {
      prismaMock.blog.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/blogs/public/does-not-exist");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/blogs", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).post("/api/blogs").send({});
      expect(res.status).toBe(401);
    });

    it("creates a blog successfully with a valid cookie", async () => {
      prismaMock.blogCategory.findUnique.mockResolvedValue(CATEGORY as any);
      prismaMock.blog.create.mockResolvedValue(BLOG as any);

      const res = await request(app)
        .post("/api/blogs")
        .set("Cookie", authCookie())
        .send({
          title: BLOG.title,
          slug: BLOG.slug,
          excerpt: BLOG.excerpt,
          content: BLOG.content,
          type: BLOG.type,
          categoryId: CATEGORY.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe(BLOG.slug);
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/blogs")
        .set("Cookie", authCookie())
        .send({ title: "Missing fields" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when categoryId does not exist", async () => {
      prismaMock.blogCategory.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/blogs")
        .set("Cookie", authCookie())
        .send({
          title: BLOG.title,
          slug: BLOG.slug,
          excerpt: BLOG.excerpt,
          content: BLOG.content,
          type: BLOG.type,
          categoryId: "does-not-exist",
        });

      expect(res.status).toBe(400);
    });

    it("strips scripts and event handlers from rich-text content", async () => {
      prismaMock.blogCategory.findUnique.mockResolvedValue(CATEGORY as any);
      prismaMock.blog.create.mockImplementation((({ data }: any) => Promise.resolve({ ...BLOG, ...data })) as any);

      const res = await request(app)
        .post("/api/blogs")
        .set("Cookie", authCookie())
        .send({
          title: BLOG.title,
          slug: BLOG.slug,
          excerpt: BLOG.excerpt,
          content: '<p onclick="alert(1)">Hello</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
          type: BLOG.type,
          categoryId: CATEGORY.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('<p>Hello</p><img src="x" />');
    });

    it("preserves Quill-authored formatting (headers, lists, colored spans, links)", async () => {
      prismaMock.blogCategory.findUnique.mockResolvedValue(CATEGORY as any);
      prismaMock.blog.create.mockImplementation((({ data }: any) => Promise.resolve({ ...BLOG, ...data })) as any);

      const content =
        '<h2>Title</h2><ul><li>One</li></ul><span style="color: rgb(230,0,0)">red</span><a href="https://example.com">link</a>';

      const res = await request(app)
        .post("/api/blogs")
        .set("Cookie", authCookie())
        .send({
          title: BLOG.title,
          slug: BLOG.slug,
          excerpt: BLOG.excerpt,
          content,
          type: BLOG.type,
          categoryId: CATEGORY.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toContain("<h2>Title</h2>");
      expect(res.body.content).toContain("<li>One</li>");
      expect(res.body.content).toContain('style="color:rgb(230,0,0)"');
      expect(res.body.content).toContain('<a href="https://example.com" rel="noopener noreferrer" target="_blank">link</a>');
    });
  });

  describe("GET /api/blogs", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).get("/api/blogs");
      expect(res.status).toBe(401);
    });

    it("returns 200 with a valid cookie", async () => {
      prismaMock.blog.findMany.mockResolvedValue([BLOG] as any);
      prismaMock.blog.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/blogs")
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/blogs/:id", () => {
    it("returns 404 when not found", async () => {
      prismaMock.blog.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/blogs/${BLOG.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/blogs/:id", () => {
    it("updates a blog", async () => {
      prismaMock.blog.findUnique.mockResolvedValue(BLOG as any);
      prismaMock.blog.update.mockResolvedValue({
        ...BLOG,
        title: "Updated title",
      } as any);

      const res = await request(app)
        .patch(`/api/blogs/${BLOG.id}`)
        .set("Cookie", authCookie())
        .send({ title: "Updated title" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated title");
    });
  });

  describe("DELETE /api/blogs/:id", () => {
    it("deletes a blog", async () => {
      prismaMock.blog.findUnique.mockResolvedValue(BLOG as any);
      prismaMock.blog.delete.mockResolvedValue(BLOG as any);

      const res = await request(app)
        .delete(`/api/blogs/${BLOG.id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
    });
  });
});
