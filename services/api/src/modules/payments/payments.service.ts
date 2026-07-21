import type Stripe from "stripe";
import type { PrismaClient } from "../../generated/prisma/index.js";

export interface CreateCheckoutSessionInput {
  userId: string;
  amount: number; // smallest currency unit, e.g. cents
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  paymentId: string;
  checkoutUrl: string;
}

const COMPLETED_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

const FAILED_EVENTS = new Set(["checkout.session.async_payment_failed", "checkout.session.expired"]);

export class PaymentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stripe: Stripe,
  ) {}

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: input.currency,
            unit_amount: input.amount,
            product_data: { name: "Domain Node Platform payment" },
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId: input.userId,
        stripeCheckoutSessionId: session.id,
        amount: input.amount,
        currency: input.currency,
        status: "pending",
      },
    });

    return { paymentId: payment.id, checkoutUrl: session.url };
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    if (COMPLETED_EVENTS.has(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.prisma.payment.updateMany({
        where: { stripeCheckoutSessionId: session.id },
        data: { status: "completed" },
      });
      return;
    }

    if (FAILED_EVENTS.has(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.prisma.payment.updateMany({
        where: { stripeCheckoutSessionId: session.id },
        data: { status: "failed" },
      });
    }
  }

  async getPaymentsForUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
