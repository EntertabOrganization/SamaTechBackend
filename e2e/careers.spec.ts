import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Career applications API", () => {
  test("public multipart create, then protected update/delete round-trip", async ({ request }) => {
    const email = `e2e-api-career.${Date.now()}@example.com`;

    const createRes = await request.post("api/careers", {
      multipart: {
        firstName: "API",
        lastName: "Tester",
        email,
        phone: "+1-555-000-2222",
        address: "1 Test Ave",
        city: "Testville",
        country: "Testland",
        expectedSalary: "USD 1,000 / month",
        position: "QA Engineer",
        startDate: "2026-06-01",
        resume: { name: "resume.pdf", mimeType: "application/pdf", buffer: Buffer.from("resume contents") },
        coverLetter: { name: "cover-letter.pdf", mimeType: "application/pdf", buffer: Buffer.from("cover letter contents") },
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.status).toBe("PENDING");
    expect(created.resumeUrl).toContain("uploads/");

    await login(request);

    const getRes = await request.get(`api/careers/${created.id}`);
    expect(getRes.ok()).toBeTruthy();

    const updateRes = await request.patch(`api/careers/${created.id}`, { data: { status: "REVIEWED" } });
    expect(updateRes.ok()).toBeTruthy();
    expect((await updateRes.json()).status).toBe("REVIEWED");

    const deleteRes = await request.delete(`api/careers/${created.id}`);
    expect(deleteRes.ok()).toBeTruthy();
    expect((await request.get(`api/careers/${created.id}`)).status()).toBe(404);
  });

  test("rejects a create request missing the required files", async ({ request }) => {
    const res = await request.post("api/careers", {
      multipart: {
        firstName: "Missing",
        lastName: "Files",
        email: `e2e-missing.${Date.now()}@example.com`,
        phone: "+1-555-000-3333",
        address: "1 Test Ave",
        city: "Testville",
        country: "Testland",
        expectedSalary: "USD 1,000",
        position: "QA Engineer",
        startDate: "2026-06-01",
      },
    });
    expect(res.status()).toBe(400);
  });
});
