import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie, TEST_USER } from "./utils/testAuth";
import { swaggerSpec } from "../src/swagger/swagger";

const user = { id: "user-id", email: "user@example.com", name: "User", createdAt: new Date(), updatedAt: new Date() };

describe("User management", () => {
  it("requires authentication to create and list users", async () => {
    expect((await request(app).get("/api/users")).status).toBe(401);
    expect((await request(app).post("/api/users").send({})).status).toBe(401);
  });

  it("hashes new passwords and excludes hashes from the response selection", async () => {
    prismaMock.user.create.mockResolvedValue(user as any);
    const res = await request(app).post("/api/users").set("Cookie", authCookie())
      .send({ email: user.email, password: "Secret@123", name: user.name, role: "BOOKING" });
    expect(res.status).toBe(201);
    const call = prismaMock.user.create.mock.calls[0][0];
    expect(await bcrypt.compare("Secret@123", call.data.passwordHash as string)).toBe(true);
    expect(call.select).not.toHaveProperty("passwordHash");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("lists users with pagination without selecting password hashes", async () => {
    prismaMock.user.findMany.mockResolvedValue([user] as any);
    prismaMock.user.count.mockResolvedValue(1);
    const res = await request(app).get("/api/users").set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.data[0].email).toBe(user.email);
    expect(res.body.meta.total).toBe(1);
    expect(prismaMock.user.findMany.mock.calls[0][0]?.select).not.toHaveProperty("passwordHash");
  });

  it("rejects short passwords and duplicate emails", async () => {
    const short = await request(app).post("/api/users").set("Cookie", authCookie())
      .send({ email: user.email, password: "short", role: "ADMIN" });
    expect(short.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    prismaMock.user.create.mockRejectedValue({ code: "P2002" });
    const duplicate = await request(app).post("/api/users").set("Cookie", authCookie())
      .send({ email: user.email, password: "Secret@123", role: "ADMIN" });
    expect(duplicate.status).toBe(409);
  });
});

describe("Roles", () => {
  const signedInAs = (role: string) =>
    prismaMock.user.findUnique.mockResolvedValue({ ...TEST_USER, role } as any);

  it("requires a valid role when creating a user", async () => {
    const res = await request(app).post("/api/users").set("Cookie", authCookie())
      .send({ email: user.email, password: "Secret@123", role: "OWNER" });
    expect(res.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("lets only admins manage users", async () => {
    for (const role of ["CONTACT", "BOOKING"]) {
      signedInAs(role);
      expect((await request(app).get("/api/users").set("Cookie", authCookie())).status).toBe(403);
      expect((await request(app).delete("/api/users/x").set("Cookie", authCookie())).status).toBe(403);
    }
  });

  it("limits CONTACT to contact messages and BOOKING to consultations and availability", async () => {
    prismaMock.contactMessage.findMany.mockResolvedValue([]);
    prismaMock.contactMessage.count.mockResolvedValue(0);
    prismaMock.consultation.findMany.mockResolvedValue([]);
    prismaMock.consultation.count.mockResolvedValue(0);
    prismaMock.availabilityRule.findMany.mockResolvedValue([]);

    signedInAs("CONTACT");
    expect((await request(app).get("/api/contact").set("Cookie", authCookie())).status).toBe(200);
    expect((await request(app).get("/api/consultations").set("Cookie", authCookie())).status).toBe(403);
    expect((await request(app).delete("/api/availability").set("Cookie", authCookie())).status).toBe(403);

    signedInAs("BOOKING");
    expect((await request(app).get("/api/contact").set("Cookie", authCookie())).status).toBe(403);
    expect((await request(app).get("/api/consultations").set("Cookie", authCookie())).status).toBe(200);
    expect((await request(app).delete("/api/availability").set("Cookie", authCookie())).status).toBe(200);
  });

  it("rejects a token whose account was deleted", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect((await request(app).get("/api/contact").set("Cookie", authCookie())).status).toBe(401);
  });
});

describe("Editing and deleting users", () => {
  const other = { ...user, id: "other-id", role: "ADMIN" };

  it("updates the fields sent and re-hashes a new password", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ ...TEST_USER, role: "ADMIN" } as any)
      .mockResolvedValueOnce({ ...other, role: "BOOKING" } as any);
    prismaMock.user.update.mockResolvedValue({ ...other, role: "CONTACT" } as any);
    const res = await request(app).patch("/api/users/other-id").set("Cookie", authCookie())
      .send({ role: "CONTACT", password: "NewPass@123" });
    expect(res.status).toBe(200);
    const call = prismaMock.user.update.mock.calls[0][0];
    expect(call.data.role).toBe("CONTACT");
    expect(await bcrypt.compare("NewPass@123", call.data.passwordHash as string)).toBe(true);
    expect(call.select).not.toHaveProperty("passwordHash");
  });

  it("never leaves the dashboard without an admin", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ ...TEST_USER, role: "ADMIN" } as any)
      .mockResolvedValueOnce(other as any);
    prismaMock.user.count.mockResolvedValue(1);
    const res = await request(app).delete("/api/users/other-id").set("Cookie", authCookie());
    expect(res.status).toBe(400);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("refuses to delete or demote the signed-in account", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...TEST_USER, role: "ADMIN" } as any);
    prismaMock.user.count.mockResolvedValue(3);
    expect((await request(app).delete(`/api/users/${TEST_USER.id}`).set("Cookie", authCookie())).status).toBe(400);
    expect((await request(app).patch(`/api/users/${TEST_USER.id}`).set("Cookie", authCookie()).send({ role: "BOOKING" })).status).toBe(400);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("deletes another user", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ ...TEST_USER, role: "ADMIN" } as any)
      .mockResolvedValueOnce({ ...other, role: "CONTACT" } as any);
    prismaMock.user.delete.mockResolvedValue(other as any);
    const res = await request(app).delete("/api/users/other-id").set("Cookie", authCookie());
    expect(res.status).toBe(200);
  });
});

describe("Backend scope", () => {
  it.each(["subscribers", "careers", "blogs", "blog-categories", "admins"])("removes /api/%s routes", async (resource) => {
    for (const method of ["get", "post", "patch", "delete"] as const) {
      expect((await request(app)[method](`/api/${resource}`)).status).toBe(404);
    }
  });

  it("documents only the retained modules and the User tag", () => {
    const spec = swaggerSpec as any;
    expect(spec.paths["/users"].get.tags).toEqual(["User"]);
    expect(spec.paths["/users"].post.tags).toEqual(["User"]);
    for (const path of Object.keys(spec.paths)) {
      expect(path).toMatch(/^\/(auth|users|contact|consultations|availability)(\/|$)/);
    }
  });
});
