import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { PrismaClient } from "../src/generated/prisma/index.js";
import { createTestPrisma, resetDb } from "./testPrisma.js";

let prisma: PrismaClient;
let app: Express;

const credentials = { email: "person@example.com", password: "hunter2hunter" };

beforeEach(async () => {
  prisma = createTestPrisma();
  await resetDb(prisma);
  app = createApp(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app).post("/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.session).toHaveProperty("id");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app).post("/auth/register").send(credentials);

    expect(res.status).toBe(409);
  });

  it("rejects an invalid email with 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "hunter2hunter" });

    expect(res.status).toBe(400);
  });

  it("rejects a short password with 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "short@example.com", password: "abc" });

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("logs in with correct credentials", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app).post("/auth/login").send(credentials);

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app).post("/auth/login").send(credentials);
    expect(res.status).toBe(401);
  });

  it("rejects an incorrect password with 401", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: "wrong-password" });

    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("returns the current user for a valid token", async () => {
    const registerRes = await request(app).post("/auth/register").send(credentials);
    const token = registerRes.body.token as string;

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  it("rejects a request without a token with 401", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a request with a malformed token with 401", async () => {
    const res = await request(app).get("/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/sessions/:sessionId/revoke", () => {
  it("revokes an existing session", async () => {
    const registerRes = await request(app).post("/auth/register").send(credentials);
    const { token, session } = registerRes.body as { token: string; session: { id: string } };

    const res = await request(app)
      .post(`/auth/sessions/${session.id}/revoke`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const stored = await prisma.session.findUnique({ where: { id: session.id } });
    expect(stored?.revokedAt).not.toBeNull();
  });
});
