import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, login } from "./helpers";

test.describe("Auth", () => {
  test("rejects invalid credentials", async ({ request }) => {
    const res = await request.post("api/auth/login", {
      data: { email: "wrong@example.com", password: "wrongpassword" },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects a missing email or password with 400", async ({ request }) => {
    const res = await request.post("api/auth/login", { data: { email: ADMIN_EMAIL } });
    expect(res.status()).toBe(400);
  });

  test("logs in, reads /auth/me, and logs out", async ({ request }) => {
    await login(request);

    const me = await request.get("api/auth/me");
    expect(me.ok()).toBeTruthy();
    const meBody = await me.json();
    expect(meBody.admin.email).toBe(ADMIN_EMAIL);

    const logout = await request.post("api/auth/logout");
    expect(logout.ok()).toBeTruthy();

    const meAfterLogout = await request.get("api/auth/me");
    expect(meAfterLogout.status()).toBe(401);
  });

  test("protected routes reject unauthenticated requests", async ({ request }) => {
    const res = await request.get("api/subscribers");
    expect(res.status()).toBe(401);
  });
});
