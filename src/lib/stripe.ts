import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing from environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia' as any, // Use latest stable version or match your account
  appInfo: {
    name: 'Comet Comic Reader',
    version: '0.1.0',
  },
});
