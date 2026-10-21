import { test, expect } from "@playwright/test";
import { login, USER_EMAIL, USER_PASSWORD } from "./helpers";

const website = process.env.WEBSITE_E2E_URL;
const dashboard = process.env.DASHBOARD_E2E_URL;

test.describe("Website, dashboard, and Swagger integration", () => {
  test.skip(!website || !dashboard, "Set WEBSITE_E2E_URL and DASHBOARD_E2E_URL to run browser integration.");
  test.setTimeout(180_000);

  test("website messages and bookings persist and can be managed in the dashboard", async ({ page, request }) => {
    await login(request);
    const marker = `Browser QA ${Date.now()}`;
    const messageIds: string[] = [];
    const bookingIds: string[] = [];
    try {
      for (const language of ["en", "ar"]) {
        await page.context().addCookies([{ name: "samatechs-language", value: language, url: website! }]);
        const availabilityReady = page.waitForResponse((r) => r.url().endsWith("/api/availability"));
        await page.goto(`${website}/contact`);
        expect((await availabilityReady).status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        const message = page.locator('[role="tabpanel"]').nth(0);
        await message.locator('[name="name"]').fill(`${marker} ${language}`);
        await message.locator('[name="email"]').fill(`browser-${Date.now()}@example.invalid`);
        await message.locator('[name="organization"]').fill("QA Organization");
        await message.locator('[name="jobTitle"]').fill("QA Lead");
        await message.locator('[name="area"]').selectOption("Not sure yet");
        await message.locator('[name="message"]').fill(`${marker}: website message in ${language}`);
        await message.locator('[name="privacy"]').check();
        const sent = page.waitForResponse((r) => r.url().endsWith("/api/contact") && r.request().method() === "POST");
        await message.locator('button[type="submit"]').click();
        const response = await sent;
        expect(response.status()).toBe(201);
        const created = await response.json();
        messageIds.push(created.id);
        expect(created.organization).toBe("QA Organization");
        expect(created.jobTitle).toBe("QA Lead");
        await expect(message.locator('[role="status"]')).toBeVisible();

        await page.getByRole("tab").nth(1).click();
        const booking = page.locator('[role="tabpanel"]').nth(1);
        // Select a future open day, moving to the next month if necessary.
        let dates = booking.locator('button[aria-pressed="false"][aria-label]:enabled');
        if (!(await dates.count())) {
          await booking.locator('button[aria-label]:not([aria-pressed])').last().click();
          dates = booking.locator('button[aria-pressed="false"][aria-label]:enabled');
        }
        await expect(dates.first()).toBeVisible();
        await dates.last().click();
        const slots = booking.locator('button[aria-pressed="false"]:not([aria-label]):enabled');
        await expect(slots.first()).toBeVisible();
        await slots.first().click();
        await booking.locator('[name="name"]').fill(`${marker} booking ${language}`);
        await booking.locator('[name="email"]').fill(`booking-${Date.now()}@example.invalid`);
        await booking.locator('[name="organization"]').fill("QA Organization");
        await booking.locator('[name="topic"]').fill(`${marker}: browser booking`);
        const booked = page.waitForResponse((r) => r.url().endsWith("/api/consultations") && r.request().method() === "POST");
        await booking.locator('button[type="submit"]').click();
        const bookingResponse = await booked;
        expect(bookingResponse.status()).toBe(201);
        bookingIds.push((await bookingResponse.json()).id);
        await expect(booking.locator('[role="status"]')).toBeVisible();
      }

      await page.context().addCookies([{ name: "samatechs-language", value: "en", url: dashboard! }]);
      await page.goto(`${dashboard}/login`);
      await page.locator('[name="email"]').fill(USER_EMAIL);
      await page.locator('[name="password"]').fill(USER_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(`${dashboard}/`);
      for (const route of ["/", "/messages", "/consultations", "/availability", "/users", "/content", "/content/home", "/content/services", "/content/about", "/content/seo", "/content/settings"]) {
        await page.goto(`${dashboard}${route}`);
        await expect(page.locator("main")).toBeVisible();
        await expect(page).not.toHaveURL(/\/login/);
      }

      for (const id of messageIds) {
        await page.goto(`${dashboard}/messages/${id}`);
        await expect(page.getByRole("heading", { name: new RegExp(marker) })).toBeVisible();
        await expect.poll(async () => (await (await request.get(`api/contact/${id}`)).json()).status).toBe("READ");
        await page.getByRole("button", { name: "Mark as responded" }).click();
        await expect.poll(async () => (await (await request.get(`api/contact/${id}`)).json()).status).toBe("RESPONDED");
        await page.getByRole("button", { name: /^Delete .* message$/ }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
        await expect(page).toHaveURL(`${dashboard}/messages`);
        expect((await request.get(`api/contact/${id}`)).status()).toBe(404);
      }

      for (const id of bookingIds) {
        await page.goto(`${dashboard}/consultations`);
        const record = await (await request.get(`api/consultations/${id}`)).json();
        const card = page.locator("article").filter({ hasText: record.name });
        await card.getByRole("button", { name: "Confirm", exact: true }).click();
        await expect.poll(async () => (await (await request.get(`api/consultations/${id}`)).json()).status).toBe("CONFIRMED");
        await card.getByRole("button", { name: "Mark completed" }).click();
        await expect.poll(async () => (await (await request.get(`api/consultations/${id}`)).json()).status).toBe("COMPLETED");
        await card.getByRole("button", { name: /^Delete .* request$/ }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
        await expect.poll(async () => (await request.get(`api/consultations/${id}`)).status()).toBe(404);
      }

      const schedule = await (await request.get("api/availability")).json();
      await page.goto(`${dashboard}/availability`);
      await expect(page.locator('[name="sun_start"]')).toHaveValue(schedule.data[0].timeSlots[0]);
      const save = page.waitForResponse((r) => r.url().endsWith("/api/availability") && r.request().method() === "PUT");
      await page.getByRole("button", { name: "Save changes" }).click();
      expect((await save).status()).toBe(200);
      expect(await (await request.get("api/availability")).json()).toEqual(schedule);
    } finally {
      for (const id of messageIds) await request.delete(`api/contact/${id}`);
      for (const id of bookingIds) await request.delete(`api/consultations/${id}`);
    }
  });

  test("Swagger Try it out executes public, login, and authenticated operations", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/api-docs/`);
    await expect(page.locator(".opblock")).toHaveCount(18);
    async function execute(path: string, method: string, body?: object) {
      const operation = page.locator(`.opblock-${method}`).filter({ has: page.locator(`[data-path="${path}"]`) });
      await operation.locator(".opblock-summary").click();
      await operation.getByRole("button", { name: "Try it out" }).click();
      if (body) await operation.locator("textarea").fill(JSON.stringify(body));
      const response = page.waitForResponse((r) => r.url().includes(`/api${path}`) && r.request().method() === method.toUpperCase());
      await operation.getByRole("button", { name: "Execute", exact: true }).click();
      expect((await response).status()).toBe(200);
      await expect(operation.locator(".live-responses-table tbody .response-col_status").first()).toContainText("200");
    }
    await execute("/availability", "get");
    await execute("/auth/login", "post", { email: USER_EMAIL, password: USER_PASSWORD });
    await execute("/auth/me", "get");
    await execute("/users", "get");
    await execute("/auth/logout", "post");
  });
});
