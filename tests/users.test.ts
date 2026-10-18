import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app";
import { prismaMock } from "./utils/prismaMock";
import { authCookie } from "./utils/testAuth";
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
      .send({ email: user.email, password: "Secret@123", name: user.name });
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
      .send({ email: user.email, password: "short" });
    expect(short.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    prismaMock.user.create.mockRejectedValue({ code: "P2002" });
    const duplicate = await request(app).post("/api/users").set("Cookie", authCookie())
      .send({ email: user.email, password: "Secret@123" });
    expect(duplicate.status).toBe(409);
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
