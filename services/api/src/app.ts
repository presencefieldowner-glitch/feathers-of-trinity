import cors from "cors";
import express, { type Express } from "express";
import type Stripe from "stripe";
import type { PrismaClient } from "./generated/prisma/index.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createPaymentsRouter, createPaymentsWebhookRouter } from "./modules/payments/payments.routes.js";

export interface CreateAppOptions {
  /** Override the Stripe client used by the payments routes (tests only). */
  readonly stripe?: Stripe;
}

export function createApp(prisma: PrismaClient, options: CreateAppOptions = {}): Express {
  const app = express();

  app.use(cors());

  // Mounted before express.json(): Stripe webhook signature verification
  // needs the raw, unparsed request body.
  app.use("/payments", createPaymentsWebhookRouter(prisma, options.stripe));

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/auth", createAuthRouter(prisma));
  app.use("/payments", createPaymentsRouter(prisma, options.stripe));

  return app;
}
