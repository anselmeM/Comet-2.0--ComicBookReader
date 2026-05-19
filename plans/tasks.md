# Comet 2.0 - Implementation Tasks

**Last Updated:** 2026-05-11  
**Project:** Comet SaaS Evolution  
**Status:** In Progress (Transitioning to SaaS)

---

## Phase 1: Marketing Landing Page Refactor (COMPLETE)

### Task 1: Set Up Animation Variants
- [x] Keep existing `fadeIn` variant
- [x] Add `heroTextVariant` for main headline
- [x] Add `featureCardVariant` for feature cards
- [x] Add `navVariant` for navigation slide-down
- [x] Add `buttonTapVariant` for button press effect
- [x] Add `blobVariant` for animated background blobs

### Task 2: Implement Navigation Animations
- [x] Animate nav container
- [x] Add logo hover effect
- [x] Animate navigation links
- [x] Animate mobile hamburger menu

### Task 3: Implement Hero Section Animations
- [x] Add animated background blobs
- [x] Enhance hero badge with spring animation
- [x] Enhance main headline with word reveal
- [x] Enhance CTA buttons (Hover/Tap)

### Task 4: Implement Features Grid Animations
- [x] Update features container animation with viewport trigger
- [x] Enhance FeatureCard component (lift, border color, icon rotate)

### Task 5: Accessibility & Performance (Optimized)
- [x] Add Reduced Motion Support (useReducedMotion + CSS fallback)
- [x] Optimize for GPU-accelerated properties (transform/opacity)
- [x] Enhance accessibility (aria-hidden, aria-label)

---

## Phase 2: Core Feature Enhancements (COMPLETE)

### Task 6: Server-Synced Metadata
- [x] Synchronize Favorites with database (Prisma update + useUpdateComic mutation)
- [x] Synchronize Ratings with database
- [x] Implement dynamic "Top Rated" section in dashboard

### Task 7: Manual Metadata Editor
- [x] Create `MetadataModal` component for manual comic detail entry
- [x] Integrate "Edit Details" action into `DashboardComicCard`
- [x] Ensure manual edits persist to database and update UI optimistically

---

## Phase 3: SaaS Transformation (IN PROGRESS)

### Task 8: Billing & Subscription Infrastructure (COMPLETE)
- [x] **Database:** Add Stripe IDs and plan fields to `User` model
- [x] **Server:** Initialize Stripe SDK and implement Checkout API
- [x] **Server:** Implement Customer Portal API
- [x] **Sync:** Build secure Webhook handler for subscription lifecycle
- [x] **Frontend:** Create `useSubscription` hook and "Upgrade" CTAs in dashboard

### Task 9: Cloud Comic Sync for Premium (COMPLETE)
- [x] **Infrastructure:** Setup S3/R2 storage client and Prisma storage tracking
- [x] **Backend:** Implement pre-signed upload and download URL APIs
- [x] **Ingestion:** Update parser to background-sync new comics to cloud for Premium users
- [x] **Recovery:** Implement "Restore from Cloud" UI and logic for missing local files

### Task 10: Pricing & Tiered Experience (COMPLETE)
- [x] **Task 10.1: Pricing Page:** Build high-impact `/pricing` page with comparative tier table
- [x] **Task 10.2: Feature Gating:** Restrict ComicVine auto-enrichment to Premium users
- [x] **Task 10.3: Middleware:** Implement tier-based access control in `middleware.ts`
- [x] **Task 10.4: Upgrade Modals:** Add "Premium Feature" modals when Free users click locked actions

### Task 11: Admin & Analytics (COMPLETE)
- [x] **Task 11.1: Admin Role:** Add `ADMIN` role to User model
- [x] **Task 11.2: Admin View:** Create protected `/admin` route for revenue tracking
- [x] **Task 11.3: Storage Stats:** Track total S3/R2 usage and user storage quotas

---

## Phase 4: UI Reference Guide Compliance (COMPLETE)

*Note: All components are functionally complete. Their styling had diverged from the original `UI_REFERENCE_GUIDE.md` due to the recent "Midnight Nebula" / Comic-Modern redesign. The guide has now been updated to version 2.0 to reflect these new, modern design tokens.*

### Component Audit Status
- [x] **Sidebar Navigation:** Guide updated to reflect `font-black italic`, `320px` width, `rounded-[1.8rem]`, icon size 24.
- [x] **Header / Search:** Guide updated to reflect `max-w-2xl`, dark background.
- [x] **Notification Bell:** **COMPLIANT** (Red dot logic and layout matches).
- [x] **User Profile:** Guide updated to reflect `font-black text-neutral-900`.
- [x] **Featured Hero Card:** Guide updated to reflect `rounded-[2.5rem]`, `font-black text-5xl`.
- [x] **Continue Reading Widget:** Guide updated to reflect `2.5rem` border radius.
- [x] **Favourite Heroes:** Guide updated to reflect `96x96px` avatars.
- [x] **Comics Grid:** **COMPLIANT** (Grid columns, aspect ratio, and hover states match the guide).

**RESOLUTION:** The `UI_REFERENCE_GUIDE.md` was updated to version 2.0 to document the new "Comic-Modern" design system. The codebase and the design guide are now fully synchronized.

---

## Phase 5: Production Readiness & Optimization (COMPLETE)

### Task 12: Infrastructure Scaling (COMPLETE)
- [x] **Task 12.1: PostgreSQL Migration** - Move from SQLite to Neon (PostgreSQL).
- [x] **Task 12.2: Redis Caching** - Setup Upstash Redis for API caching.
- [x] **Task 12.3: Rate Limiting** - Implement advanced rate limiting on auth and storage routes.

### Task 13: Enhanced UX & Analytics (COMPLETE)
- [x] **Task 13.1: Reading Statistics** - Track time spent reading and comics completed.
- [x] **Task 13.2: User Streaks** - Implement daily reading streaks and milestones.
- [x] **Task 13.3: Global Search** - Implement cross-collection global search with Fuse.js.


---

## Execution Order

1. **Task 10.1** - Build the Pricing Page UI
2. **Task 10.2** - Implement Feature Gating (Metadata Enrichment)
3. **Task 10.3** - Setup Middleware Access Control
4. **Task 11** - Admin Dashboard
5. **Phase 4** - Reconcile UI Guide vs Implementation

---

## Dependencies

- Stripe (configured)
- AWS SDK (configured)
- Framer Motion (already in project)
- Prisma (already in project)
