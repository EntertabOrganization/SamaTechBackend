import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/** A Sunday at least a week ahead — open in the seeded Sunday-to-Thursday schedule. */
function upcomingSunday(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7 + ((7 - date.getUTCDay()) % 7));
  return date.toISOString().slice(0, 10);
}

test.describe("Consultations API", () => {
  test("public create, then protected list/update/delete round-trip", async ({ request }) => {
    const email = `e2e-api-consultation.${Date.now()}@example.com`;

    const createRes = await request.post("api/consultations", {
      data: {
        name: "API Tester",
        email,
        company: "Testland Holdings",
        notes: "Booked from the API e2e suite.",
        date: upcomingSunday(),
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
        date: "not-a-date",
        time: "10:00",
      },
    });
    expect(res.status()).toBe(400);
  });
});
