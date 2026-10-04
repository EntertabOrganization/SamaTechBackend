import { APIRequestContext, expect } from "@playwright/test";

export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "Admin@1234";

/** Logs in against the real /auth/login endpoint; the request context keeps the cookie for subsequent calls. */
export async function login(request: APIRequestContext) {
  const res = await request.post("api/auth/login", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.ok(), "login should succeed with seeded admin credentials").toBeTruthy();
}
