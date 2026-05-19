# SaaS Billing & Subscription Transition Plan

## 1. Objective
Transform Comet 2.0 from a free, local-only PWA into a monetized SaaS application by integrating Stripe for subscription management. This will allow users to upgrade from the default "Free Reader" plan to a monetized "Premium" plan, unlocking future cloud features.

## 2. Background & Motivation
Currently, Comet 2.0 provides an excellent local reading experience with zero server storage costs. To sustain development and support upcoming cloud-heavy features (like cross-device S3 comic syncing and unlimited auto-enrichment), we need a revenue engine. The database already anticipates this with the `plan` field on the `User` model, making billing the logical next foundational step.

## 3. Scope & Impact
- **Database Schema:** Extend the `User` model with Stripe-specific tracking fields.
- **Payment Provider:** Integrate Stripe for Checkout and Customer Portal.
- **Webhooks:** Create a secure API endpoint to listen to Stripe lifecycle events.
- **Frontend UI:** Build a `/pricing` page and integrate upgrade prompts into the existing dashboard.

## 4. Proposed Solution

### 4.1 Database Schema Updates
We will add the following fields to the `User` model in `prisma/schema.prisma` to keep the local database in sync with Stripe:
```prisma
  stripeCustomerId       String?   @unique
  stripeSubscriptionId   String?   @unique
  stripePriceId          String?   
  stripeCurrentPeriodEnd DateTime? 
```

### 4.2 Stripe Integration
- Install `@stripe/stripe-js` (client) and `stripe` (server).
- **Checkout Route (`/api/stripe/checkout`):** Generates a Stripe Checkout session linked to the authenticated user's ID.
- **Billing Portal Route (`/api/stripe/billing`):** Generates a link to the Stripe Customer Portal so users can manage payment methods or cancel.

### 4.3 Webhook Handling
We will create a robust webhook handler at `/api/webhooks/stripe/route.ts` to listen for:
- `checkout.session.completed`: Initial subscription creation.
- `invoice.payment_succeeded`: Subscription renewals.
- `customer.subscription.updated` / `deleted`: Upgrades, downgrades, and cancellations.

### 4.4 Pricing & UI
- **Pricing Page:** A new `/pricing` page detailing the "Free Reader" vs "Cloud Voyager" tiers.
- **Dashboard Integration:** Update the `DashboardLayout.tsx` user profile dropdown to link to the Billing Portal for premium users, and the Pricing page for free users.

## 5. Implementation Steps
1. **Schema Update:** Modify `schema.prisma` and sync via `npx prisma db push`.
2. **Environment Setup:** Configure `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`.
3. **Core Logic:** Implement the Stripe utility lib, Checkout API, and Billing Portal API.
4. **Webhooks:** Implement and secure the webhook endpoint.
5. **UI Integration:** Build the Pricing page and update the dashboard navigation.

## 6. Verification
- **Checkout Flow:** Verify that upgrading via test cards successfully sets the user's `stripeSubscriptionId`.
- **Webhook Sync:** Use the Stripe CLI to trigger `invoice.payment_succeeded` and verify the `stripeCurrentPeriodEnd` updates in SQLite.
- **Access Revocation:** Cancel a subscription via the test portal and verify the user falls back to the Free plan.