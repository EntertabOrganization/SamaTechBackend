import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Subscribers API", () => {
  test.beforeEach(async ({ request }) => {
    await login(request);
  });

  test("public create, then protected list/get/update/delete round-trip", async ({ request }) => {
    const email = `e2e-api.${Date.now()}@example.com`;

    const createRes = await request.post("api/subscribers", {
      data: { email, name: "E2E API Subscriber" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.email).toBe(email);
    expect(created.status).toBe("ACTIVE");

    const listRes = await request.get("api/subscribers?limit=1000");
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    expect(list.data.some((s: { id: string }) => s.id === created.id)).toBe(true);
    expect(list.meta.total).toBeGreaterThanOrEqual(list.data.length > 0 ? 1 : 0);

    const getRes = await request.get(`api/subscribers/${created.id}`);
    expect(getRes.ok()).toBeTruthy();

    const updateRes = await request.patch(`api/subscribers/${created.id}`, {
      data: { status: "UNSUBSCRIBED" },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.status).toBe("UNSUBSCRIBED");
    expect(updated.unsubscribedAt).toBeTruthy();

    const deleteRes = await request.delete(`api/subscribers/${created.id}`);
    expect(deleteRes.ok()).toBeTruthy();

    const getAfterDelete = await request.get(`api/subscribers/${created.id}`);
    expect(getAfterDelete.status()).toBe(404);
  });

  test("rejects a duplicate email with 409", async ({ request }) => {
    const email = `e2e-dup.${Date.now()}@example.com`;
    const first = await request.post("api/subscribers", { data: { email } });
    expect(first.status()).toBe(201);

    const dup = await request.post("api/subscribers", { data: { email } });
    expect(dup.status()).toBe(409);

    const created = await first.json();
    await request.delete(`api/subscribers/${created.id}`);
  });

  test("rejects an invalid status filter with 400", async ({ request }) => {
    const res = await request.get("api/subscribers?status=NOT_A_STATUS");
    expect(res.status()).toBe(400);
  });
});
