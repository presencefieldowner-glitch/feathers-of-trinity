import express, { Router } from "express";
import type Stripe from "stripe";
import { z } from "zod";
import type { PrismaClient } from "../../generated/prisma/index.js";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/requireAuth.js";
import { PaymentsService } from "./payments.service.js";
import { getStripeClient, getStripeWebhookSecret } from "./stripeClient.js";

const checkoutSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * stripe is resolved lazily (getStripeClient() inside each handler, not at
 * router-construction time) so the app can boot and every non-payments
 * route keeps working without STRIPE_SECRET_KEY set -- only hitting a
 * payments endpoint requires it. Pass stripe explicitly to override (tests).
 */
export function createPaymentsRouter(prisma: PrismaClient, stripe?: Stripe): Router {
  const router = Router();

  router.post("/checkout", requireAuth, async (req: AuthenticatedRequest, res) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payment request", issues: parsed.error.issues });
      return;
    }

    const paymentsService = new PaymentsService(prisma, stripe ?? getStripeClient());
    const result = await paymentsService.createCheckoutSession({
      userId: req.auth!.userId,
      ...parsed.data,
    });
    res.status(201).json(result);
  });

  router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
    const paymentsService = new PaymentsService(prisma, stripe ?? getStripeClient());
    const payments = await paymentsService.getPaymentsForUser(req.auth!.userId);
    res.status(200).json({ payments });
  });

  return router;
}

/**
 * Mounted separately from createPaymentsRouter, and before the app-wide
 * express.json() body parser -- Stripe webhook signature verification
 * needs the raw, unparsed request body.
 */
export function createPaymentsWebhookRouter(prisma: PrismaClient, stripe?: Stripe): Router {
  const router = Router();

  router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      res.status(400).json({ error: "Missing Stripe signature" });
      return;
    }

    const stripeClient = stripe ?? getStripeClient();
    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, signature, getStripeWebhookSecret());
    } catch (err) {
      res.status(400).json({ error: `Webhook signature verification failed: ${String(err)}` });
      return;
    }

    const paymentsService = new PaymentsService(prisma, stripeClient);
    await paymentsService.handleWebhookEvent(event);
    res.status(200).json({ received: true });
  });

  return router;
}
