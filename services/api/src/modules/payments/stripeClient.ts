import Stripe from "stripe";

/**
 * Constructed fresh per call rather than cached -- Stripe client construction
 * doesn't itself make a network call, and this keeps tests free to inject a
 * mock client instead of hitting the real API. Throws lazily, only when a
 * payments endpoint is actually used, same pattern as jwt.ts's getSecret().
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" });
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return secret;
}
