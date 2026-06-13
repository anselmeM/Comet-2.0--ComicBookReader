import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const absoluteUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100'}${path}`;

/**
 * GET /api/stripe/portal — Creates a Stripe Customer Portal session.
 */
export async function GET() {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: absoluteUrl('/settings'),
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    logger.error('Stripe portal error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
