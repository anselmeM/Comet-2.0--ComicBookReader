import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build';

export const stripe = new Stripe(secretKey, {
  // @ts-expect-error — pinned to the account's API version (older than the SDK's

  // latest); the Stripe docs recommend a ts-comment here when pinning an older version.

  apiVersion: '2024-11-20.acacia',

  appInfo: {
    name: 'Comet Comic Reader',

    version: '0.1.0',
  },
});
