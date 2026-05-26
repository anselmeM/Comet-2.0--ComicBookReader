import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build';

export const stripe = new Stripe(secretKey, {
  apiVersion: '2024-11-20.acacia' as any, // Use latest stable version or match your account
  appInfo: {
    name: 'Comet Comic Reader',
    version: '0.1.0',
  },
});
