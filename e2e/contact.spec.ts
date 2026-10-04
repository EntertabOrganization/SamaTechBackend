import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Contact messages API", () => {
  test("public create, then protected list/update/delete round-trip", async ({ request }) => {
    const email = `e2e-api-contact.${Date.now()}@example.com`;

    const createRes = await request.post("api/contact", {
      data: { name: "API Tester", email, message: "Hello from the API e2e suite." },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.status).toBe("NEW");

    await login(request);

    const listRes = await request.get("api/contact?limit=1000");
    const list = await listRes.json();
    expect(list.data.some((m: { id: string }) => m.id === created.id)).toBe(true);

    const updateRes = await request.patch(`api/contact/${created.id}`, { data: { status: "READ" } });
    expect(updateRes.ok()).toBeTruthy();
    expect((await updateRes.json()).status).toBe("READ");

    const deleteRes = await request.delete(`api/contact/${created.id}`);
    expect(deleteRes.ok()).toBeTruthy();
    expect((await request.get(`api/contact/${created.id}`)).status()).toBe(404);
  });

  test("rejects a create request missing required fields", async ({ request }) => {
    const res = await request.post("api/contact", { data: { name: "No Email" } });
    expect(res.status()).toBe(400);
  });
});
