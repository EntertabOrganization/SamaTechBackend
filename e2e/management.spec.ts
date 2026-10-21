import { PrismaClient } from "@prisma/client";
import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Dashboard management API", () => {
  test("creates a user, excludes password hashes, rejects duplicates, and supports that user's login", async ({ request }) => {
    await login(request);
    const email = `e2e-user.${Date.now()}@example.invalid`;
    const body = { email, password: "QA-Test-Password-2026", name: "API QA User" };
    let id: string | undefined;
    try {
      const created = await request.post("api/users", { data: body });
      expect(created.status()).toBe(201);
      const user = await created.json();
      id = user.id;
      expect(user).not.toHaveProperty("passwordHash");
      const list = await (await request.get("api/users?limit=1000")).json();
      expect(list.data.some((row: { id: string }) => row.id === id)).toBe(true);
      expect(list.data.every((row: object) => !("passwordHash" in row))).toBe(true);
      expect((await request.post("api/users", { data: body })).status()).toBe(409);
      expect((await request.post("api/auth/login", { data: body })).status()).toBe(200);
      expect((await (await request.get("api/auth/me")).json()).user.email).toBe(email);
    } finally {
      // The API intentionally has no user deletion endpoint. Remove only this test's account.
      if (id) {
        const prisma = new PrismaClient();
        try { await prisma.user.delete({ where: { id } }); } finally { await prisma.$disconnect(); }
      }
    }
  });

  test("saves weekly availability and rejects invalid changes without altering it", async ({ request }) => {
    await login(request);
    const original = await (await request.get("api/availability")).json();
    const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, timeSlots: dayOfWeek === 1 ? ["09:00", "10:30"] : [] }));
    try {
      const saved = await request.put("api/availability", { data: { days } });
      expect(saved.status()).toBe(200);
      expect(await saved.json()).toEqual({ data: days });
      const invalidPayloads = [days.slice(1), days.map((d, i) => i === 0 ? { ...d, dayOfWeek: 0.5 } : d), days.map((d) => ({ ...d, timeSlots: ["25:00"] }))];
      for (const invalid of invalidPayloads) {
        expect((await request.put("api/availability", { data: { days: invalid } })).status()).toBe(400);
        expect(await (await request.get("api/availability")).json()).toEqual({ data: days });
      }
    } finally {
      expect((await request.put("api/availability", { data: { days: original.data } })).status()).toBe(200);
    }
  });

  test("booked slots reject duplicates and cancellation makes the slot available again", async ({ request }) => {
    await login(request);
    const days = (await (await request.get("api/availability")).json()).data;
    const rule = days.find((day: { timeSlots: string[] }) => day.timeSlots.length);
    expect(rule).toBeTruthy();
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 14 + (7 + rule.dayOfWeek - date.getUTCDay()) % 7);
    const day = date.toISOString().slice(0, 10);
    const booked = (await (await request.get(`api/consultations/booked?date=${day}`)).json()).data;
    const time = rule.timeSlots.find((slot: string) => !booked.includes(slot));
    expect(time).toBeTruthy();
    const body = { name: "Slot lifecycle QA", email: "slot-qa@example.invalid", date: day, time };
    const ids: string[] = [];
    try {
      const response = await request.post("api/consultations", { data: body });
      expect(response.status()).toBe(201);
      const created = await response.json();
      ids.push(created.id);
      expect((await request.get(`api/consultations/${created.id}`)).status()).toBe(200);
      expect((await (await request.get(`api/consultations/booked?date=${day}`)).json()).data).toContain(time);
      expect((await request.post("api/consultations", { data: body })).status()).toBe(409);
      expect((await request.patch(`api/consultations/${created.id}`, { data: { status: "CANCELLED" } })).status()).toBe(200);
      expect((await (await request.get(`api/consultations/booked?date=${day}`)).json()).data).not.toContain(time);
      const replacement = await request.post("api/consultations", { data: body });
      expect(replacement.status()).toBe(201);
      ids.push((await replacement.json()).id);
    } finally {
      for (const id of ids) await request.delete(`api/consultations/${id}`);
    }
  });

  test("protects every dashboard operation from unauthenticated requests", async ({ request }) => {
    for (const path of ["api/users", "api/contact", "api/contact/missing", "api/consultations", "api/consultations/missing", "api/auth/me"]) {
      expect((await request.get(path)).status()).toBe(401);
    }
    expect((await request.put("api/availability", { data: { days: [] } })).status()).toBe(401);
    expect((await request.post("api/users", { data: {} })).status()).toBe(401);
    for (const path of ["api/contact/missing", "api/consultations/missing"]) {
      expect((await request.patch(path, { data: {} })).status()).toBe(401);
      expect((await request.delete(path)).status()).toBe(401);
    }
    expect((await request.post("api/auth/logout")).status()).toBe(401);
  });
});
