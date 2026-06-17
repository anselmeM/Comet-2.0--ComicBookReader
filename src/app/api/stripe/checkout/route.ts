import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const absoluteUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100'}${path}`;

/**
 * GET /api/stripe/checkout — Creates a Stripe Checkout session.
 */
export async function GET(request: NextRequest) {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeCustomerId: true,
      },
    });

    // Determine the price ID based on interval parameter (monthly/annual)
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || 'monthly';
    const priceId =
      interval === 'annual'
        ? process.env.STRIPE_PREMIUM_PRICE_ID_ANNUAL
        : process.env.STRIPE_PREMIUM_PRICE_ID;

    // Dev mode bypass: immediately update user to PREMIUM if billing is not configured or uses dummy key
    const isDev = process.env.NODE_ENV === 'development';
    const isDummyStripe =
      !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_dummy');

    if (isDev && (isDummyStripe || !priceId)) {
      await db.user.update({
        where: { id: session.user.id },
        data: { plan: 'PREMIUM' },
      });
      logger.info('[Stripe Dev Bypass] Upgraded user to PREMIUM', {
        email: session.user.email,
        interval,
      });
      return NextResponse.json({ url: absoluteUrl('/settings?success=true') });
    }

    if (!priceId) {
      logger.error(`Stripe price configuration error for interval: ${interval}`);
      return NextResponse.json({ error: 'Billing configuration error' }, { status: 500 });
    }

    // Create or retrieve Stripe customer
    let customerId: string | undefined = user?.stripeCustomerId || undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = customer.id;

      // Update user with customer ID
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: absoluteUrl('/settings?success=true'),
      cancel_url: absoluteUrl('/settings?canceled=true'),
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    logger.error('Stripe checkout error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
