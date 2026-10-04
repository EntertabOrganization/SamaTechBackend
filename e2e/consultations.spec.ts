import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Consultations API", () => {
  test("public create, then protected list/update/delete round-trip", async ({ request }) => {
    const email = `e2e-api-consultation.${Date.now()}@example.com`;

    const createRes = await request.post("api/consultations", {
      data: {
        name: "API Tester",
        email,
        phone: "+1-555-000-4444",
        country: "Testland",
        date: "2026-06-15",
        time: "10:00",
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.status).toBe("PENDING");
    expect(created.meetLink).toBe("https://meet.google.com/new");

    await login(request);

    const listRes = await request.get("api/consultations?limit=1000");
    const list = await listRes.json();
    expect(list.data.some((c: { id: string }) => c.id === created.id)).toBe(true);

    const updateRes = await request.patch(`api/consultations/${created.id}`, { data: { status: "CONFIRMED" } });
    expect(updateRes.ok()).toBeTruthy();
    expect((await updateRes.json()).status).toBe("CONFIRMED");

    const deleteRes = await request.delete(`api/consultations/${created.id}`);
    expect(deleteRes.ok()).toBeTruthy();
    expect((await request.get(`api/consultations/${created.id}`)).status()).toBe(404);
  });

  test("rejects an invalid date with 400", async ({ request }) => {
    const res = await request.post("api/consultations", {
      data: {
        name: "Bad Date",
        email: `e2e-baddate.${Date.now()}@example.com`,
        phone: "+1-555-000-5555",
        country: "Testland",
        date: "not-a-date",
        time: "10:00",
      },
    });
    expect(res.status()).toBe(400);
  });
});
