import type { Express } from "express";
import request from "supertest";
import type Stripe from "stripe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type { PrismaClient } from "../src/generated/prisma/index.js";
import { createTestPrisma, resetDb } from "./testPrisma.js";

let prisma: PrismaClient;
let app: Express;
let mockStripe: Stripe;

const credentials = { email: "payer@example.com", password: "hunter2hunter" };

function makeMockStripe(): Stripe {
  return {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  } as unknown as Stripe;
}

async function registerAndLogin() {
  const res = await request(app).post("/auth/register").send(credentials);
  return res.body as { token: string; user: { id: string } };
}

beforeEach(async () => {
  prisma = createTestPrisma();
  await resetDb(prisma);
  mockStripe = makeMockStripe();
  app = createApp(prisma, { stripe: mockStripe });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /payments/checkout", () => {
  it("creates a pending Payment row and returns the checkout URL", async () => {
    const { token } = await registerAndLogin();
    (mockStripe.checkout.sessions.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/test-session",
    });

    const res = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 2500,
        currency: "usd",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

    expect(res.status).toBe(201);
    expect(res.body.checkoutUrl).toBe("https://checkout.stripe.com/test-session");
    expect(typeof res.body.paymentId).toBe("string");

    const stored = await prisma.payment.findUnique({ where: { id: res.body.paymentId } });
    expect(stored?.status).toBe("pending");
    expect(stored?.stripeCheckoutSessionId).toBe("cs_test_123");
    expect(stored?.amount).toBe(2500);
    expect(stored?.currency).toBe("usd");
  });

  it("rejects an invalid request with 400", async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: -5, currency: "us", successUrl: "not-a-url", cancelUrl: "not-a-url" });

    expect(res.status).toBe(400);
  });

  it("rejects a request without a token with 401", async () => {
    const res = await request(app).post("/payments/checkout").send({
      amount: 2500,
      currency: "usd",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /payments", () => {
  it("lists only the caller's own payments", async () => {
    const { token } = await registerAndLogin();
    (mockStripe.checkout.sessions.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "cs_test_456",
      url: "https://checkout.stripe.com/test-session-2",
    });

    await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1000,
        currency: "usd",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

    const res = await request(app).get("/payments").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.payments).toHaveLength(1);
    expect(res.body.payments[0].stripeCheckoutSessionId).toBe("cs_test_456");
  });
});

describe("POST /payments/webhook", () => {
  it("marks the matching payment completed on checkout.session.completed", async () => {
    const { token } = await registerAndLogin();
    (mockStripe.checkout.sessions.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "cs_test_789",
      url: "https://checkout.stripe.com/test-session-3",
    });
    const checkoutRes = await request(app)
      .post("/payments/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 500,
        currency: "usd",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

    (mockStripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_789" } },
    });

    const res = await request(app)
      .post("/payments/webhook")
      .set("stripe-signature", "test-signature")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify({ id: "evt_test" })));

    expect(res.status).toBe(200);

    const stored = await prisma.payment.findUnique({ where: { id: checkoutRes.body.paymentId } });
    expect(stored?.status).toBe("completed");
  });

  it("rejects a webhook request with no stripe-signature header", async () => {
    const res = await request(app)
      .post("/payments/webhook")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify({ id: "evt_test" })));

    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification throws", async () => {
    (mockStripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const res = await request(app)
      .post("/payments/webhook")
      .set("stripe-signature", "bad-signature")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify({ id: "evt_test" })));

    expect(res.status).toBe(400);
  });
});
