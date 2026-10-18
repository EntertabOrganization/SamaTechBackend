import { APIRequestContext, expect } from "@playwright/test";

export const USER_EMAIL = "user@samatechs.com";
export const USER_PASSWORD = "User@1234";

/** Logs in against the real /auth/login endpoint; the request context keeps the cookie for subsequent calls. */
export async function login(request: APIRequestContext) {
  const res = await request.post("api/auth/login", {
    data: { email: USER_EMAIL, password: USER_PASSWORD },
  });
  expect(res.ok(), "login should succeed with seeded user credentials").toBeTruthy();
}
