import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe — Securely handles Stripe events.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // 1. Initial subscription completed
  if (event.type === 'checkout.session.completed') {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.userId) {
      return new NextResponse('User id is required', { status: 400 });
    }

    await db.user.update({
      where: { id: session.metadata.userId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: (subscription as any).items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        plan: 'PREMIUM', // Logic to determine plan based on priceId could be added here
      },
    });
  }

  // 2. Subscription renewal or update
  if (event.type === 'invoice.payment_succeeded') {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await db.user.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        stripePriceId: (subscription as any).items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      },
    });
  }

  // 3. Subscription deleted / cancelled
  if (event.type === 'customer.subscription.deleted') {
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
  }

  return new NextResponse(null, { status: 200 });
}
