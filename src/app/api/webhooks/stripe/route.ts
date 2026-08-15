import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

/**
 * Stripe SDK v22's `Subscription` type omits `current_period_end` (a real
 * Stripe API field). Read it defensively so the webhook still syncs the
 * period end when the API returns it.
 */
function currentPeriodEndSeconds(subscription: Stripe.Subscription): number {
  return (
    (subscription as Stripe.Subscription as { current_period_end?: number }).current_period_end ??
    0
  );
}

/**
 * POST /api/webhooks/stripe — Securely handles Stripe events.
 *
 * Error semantics matter for Stripe's retry policy:
 * - 400 (signature failure, missing metadata): permanent — Stripe won't retry.
 * - 500 (transient processing failure): Stripe retries with backoff. The DB
 *   writes below are idempotent (set the same values), so retries are safe
 *   (at-least-once delivery without duplicate side effects).
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    );
  } catch (error) {
    // Invalid signature or missing secret — acknowledge with 400 (no retry).
    return new NextResponse(`Webhook Error: ${(error as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          // Non-billing checkout or missing metadata — permanent, no retry.
          return new NextResponse('User id is required', { status: 400 });
        }
        if (!session.subscription) {
          // One-off payment (no subscription) — nothing to sync; acknowledge.
          return new NextResponse(null, { status: 200 });
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = (subscription as Stripe.Subscription).items.data[0]?.price.id;
        if (!priceId) {
          throw new Error(`Subscription ${subscription.id} has no price items`);
        }

        await db.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: (subscription as Stripe.Subscription).customer as string ?? null,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(currentPeriodEndSeconds(subscription) * 1000),
            plan: 'PREMIUM',
          },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (!invoice.subscription) {
          // One-off invoice — nothing to renew; acknowledge.
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const priceId = (subscription as Stripe.Subscription).items.data[0]?.price.id;
        if (!priceId) {
          throw new Error(`Subscription ${subscription.id} has no price items`);
        }

        await db.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(currentPeriodEndSeconds(subscription) * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await db.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            plan: 'FREE',
          },
        });
        break;
      }

      default:
        // Unhandled event type — acknowledge so Stripe stops delivering it.
        break;
    }
  } catch (error) {
    logger.error('[Stripe Webhook] Processing failed', { type: event.type }, error as Error);
    // 500 → Stripe retries with backoff. Writes are idempotent, so retries
    // are safe; the failure is surfaced in logs for investigation.
    return new NextResponse('Webhook processing failed', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
