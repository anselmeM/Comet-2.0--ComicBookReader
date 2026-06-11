import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

const absoluteUrl = (path: string) => `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100'}${path}`;

/**
 * GET /api/stripe/checkout — Creates a Stripe Checkout session.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeCustomerId: true,
      },
    });

    // Determine the price ID (This should ideally come from env or config)
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    
    // Dev mode bypass: immediately update user to PREMIUM if billing is not configured or uses dummy key
    const isDev = process.env.NODE_ENV === 'development';
    const isDummyStripe = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_dummy');
    
    if (isDev && (isDummyStripe || !priceId)) {
      await db.user.update({
        where: { id: session.user.id },
        data: { plan: 'PREMIUM' },
      });
      console.log(`[Stripe Dev Bypass] Upgraded user ${session.user.email} to PREMIUM`);
      return NextResponse.json({ url: absoluteUrl('/settings?success=true') });
    }

    if (!priceId) {
      console.error('STRIPE_PREMIUM_PRICE_ID is not configured');
      return NextResponse.json({ error: 'Billing configuration error' }, { status: 500 });
    }

    // Create or retrieve Stripe customer
    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
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
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
