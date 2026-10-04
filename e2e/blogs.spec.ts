import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Blog categories + blogs API", () => {
  test.beforeEach(async ({ request }) => {
    await login(request);
  });

  test("category and blog CRUD round-trip", async ({ request }) => {
    const slug = `e2e-category-${Date.now()}`;

    const categoryRes = await request.post("api/blog-categories", {
      data: { name: "E2E Category", slug, description: "Created by the API e2e suite" },
    });
    expect(categoryRes.status()).toBe(201);
    const category = await categoryRes.json();

    const listCategoriesRes = await request.get("api/blog-categories?limit=1000");
    const categories = await listCategoriesRes.json();
    expect(categories.data.some((c: { id: string }) => c.id === category.id)).toBe(true);

    const blogSlug = `e2e-blog-${Date.now()}`;
    const createBlogRes = await request.post("api/blogs", {
      data: {
        title: "E2E API Blog",
        slug: blogSlug,
        excerpt: "excerpt",
        content: "content",
        type: "BLOG",
        status: "DRAFT",
        categoryId: category.id,
      },
    });
    expect(createBlogRes.status()).toBe(201);
    const blog = await createBlogRes.json();
    expect(blog.status).toBe("DRAFT");

    const updateBlogRes = await request.patch(`api/blogs/${blog.id}`, {
      data: { status: "PUBLISHED" },
    });
    expect(updateBlogRes.ok()).toBeTruthy();
    expect((await updateBlogRes.json()).status).toBe("PUBLISHED");

    const filteredRes = await request.get(`api/blogs?categoryId=${category.id}&type=BLOG`);
    const filtered = await filteredRes.json();
    expect(filtered.data.some((b: { id: string }) => b.id === blog.id)).toBe(true);

    await request.delete(`api/blogs/${blog.id}`);
    await request.delete(`api/blog-categories/${category.id}`);

    expect((await request.get(`api/blogs/${blog.id}`)).status()).toBe(404);
    expect((await request.get(`api/blog-categories/${category.id}`)).status()).toBe(404);
  });

  test("rejects a blog with a categoryId that doesn't exist", async ({ request }) => {
    const res = await request.post("api/blogs", {
      data: {
        title: "Orphan Blog",
        slug: `orphan-${Date.now()}`,
        excerpt: "e",
        content: "c",
        type: "BLOG",
        categoryId: "00000000-0000-0000-0000-000000000000",
      },
    });
    expect(res.status()).toBe(400);
  });
});
