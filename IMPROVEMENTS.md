# Comet — Improvements Backlog

Living backlog of high-value improvements for Comet (Next.js comic reader).
Priorities: **P0** (security/reliability/user-data), **P1** (high value, contained), **P2** (polish/quality).
Items marked ✅ are already done — kept for context.

---

## A. UI / UX

### A1. ✅ Accessibility pass (done)
Search-focus ring, contrast (neutral-400/300 → 500), active mobile-nav blue-600,
`MotionConfig reducedMotion="user"`, safe-area bottom nav, 44px touch targets,
global `:focus-visible`.

### A2. Dashboard accent: `blue` vs `comet-accent` ✅ (decision: comet violet)
`DashboardSidebar`/`MobileBottomNav`/`DashboardHeader` use hardcoded `blue-*`
while the rest of the app is tokenized (`comet-accent`; landing accent is
orange/lime). Decide the brand accent and tokenize it — currently the dashboard
won't follow a theme accent change. **Effort: S — decision required.**
Decision (user): the brand accent is **comet violet**. The accent token is now
purple in all themes (dark `#8b7cf6`, light/sepia `#6d5ce8`; hovers brighter),
and ~195 hardcoded `blue-*`/`indigo-*` utilities across the dashboard (sidebar,
nav, tabs, buttons, cards, gradients, heatmap fills) were mapped to
`comet-accent`/`comet-accent-hover` (gradient cards use white/opacity text).
Also fixed `PWAUpdater`'s undefined `bg-comet-blue/90` → `bg-comet-accent/90`.

### A3. Adopt `cn()` (tailwind-merge)
`tailwind-merge` is installed but unused; components compose conditional classes
with template literals. Introduce `src/lib/cn.ts` and migrate the conditional
`className` patterns (DashboardHeader/Sidebar, MobileBottomNav, SearchResultsView
first). **Effort: M — convention PR.**

### A4. God-file refactors (maintainability + perf)
| File | Lines | Split into |
|---|---|---|
| `FriendsView.tsx` | 1431 | list / detail / invites / requests components |
| `SettingsPanel.tsx` | 1013 | section components (billing, profile, theme, data) |
| `CollectionsView.tsx` | 944 | collection cards / detail / editor |
| `page.tsx` | ~1100 (post-sandbox split) | Features + Footer lazy sections |
| `DashboardComicCard.tsx` | 538 | card / progress / menu |

### A5. Reader UX polish
- Guided-view / panel-detection settings discoverability (first-run hint)
- Keyboard navigation in the reader (arrows, +/- zoom, m) with visible focus
- ARIA live region for progress % / page changes
- Empty states across library / friends / collections / DMs (illustration + CTA)

### A6. Landing page
- Split Features + Footer into lazy sections (extends the sandbox split; keeps
  TTI low as more content is added)
- Hero typography/visual pass (LCP element is the h1 — keep it transform-only)

### A7. Theme & consistency ✅ (hex audit; skeleton pass open)
- Audit hardcoded hexes (`#ff5a00`, `#a3e635`, `#eab308`, `#ef4444`, …) against
  tokens; move to `@theme` where they're used repeatedly — **done**: 9 brand
  tokens (`comet-orange`, `-orange-hover/light`, `comet-lime`, `-lime-light`,
  `comet-gold`, `comet-red`, `comet-ink`, `comet-ink-2`) added to `globals.css`;
  ~214 hardcoded hexes across the landing/auth pages → `utility-comet-*`
  classes (sticker shadows + framer `borderColor` use `var(--color-*)`). Only
  runtime canvas paints in the sandbox demo keep literal hexes.
- Consistent loading skeletons vs spinners (one pattern per context) — still open.

### A8. PWA / offline
- Offline reading: cache downloaded comics for offline mode (IndexedDB + SW)
- Install prompt + update flow polish (current SW does caching; UX pass needed)

---

## B. Security

### B1. ✅ Critical auth + runtime fixes (done)
`@auth/core` 0.41.3 / next-auth beta.32 (getToken, email-homoglyph, PKCE),
Stripe checkout fail-closed, OAuth provider guards, test-bypass gate,
feed-cache isolation, user-search email leak, pagination clamp, CSP inline styles,
Stripe webhook hardening (retry-safe), e2e isolated from prod DB, dependency
audit gate (production criticals).

### B2. Production-dependency security highs (P1)
| Dep | Issue | Fix | Effort |
|---|---|---|---|
| `nodemailer` ≤9 | CRLF injection in List-* headers (invites/reset mailer) | bump ≥9 | S |
| `sharp` <0.35 | high advisory | bump ≥0.35 | S |
| `js-yaml` (via `swagger-ui-react`) | high | bump or drop swagger-ui page | S |
| `serialize-javascript` (workbox) | high | bump | S |
| `postcss` (via next) | high | bump with next | S |
| `next` | high advisory | **scoped separately** (version-dependent, regression risk) | L |

### B3. Rate limiting & auth hardening (P1)
- Trust platform IP for rate limiting (`x-vercel-forwarded-for`/`x-real-ip`), not
  spoofable `x-forwarded-for`
- **Fail-closed** when Redis is absent (currently silent in-memory fallback —
  effective only per-instance on serverless)
- Per-IP lockout on login attempts (prevent credential-stuffing)
- `register` 409 reveals account existence → return generic 200/400

### B4. SMTP error handling (P1)
`friends/invite` sends mail without the reset-password-style guard and reports
success on silent failure — mirror the guard, surface failures.

### B5. Webhook idempotency (P2)
Processing is already retry-safe (idempotent writes); add an `event.id` dedupe
key for belt-and-braces.

### B6. Startup env guards (P2)
Fail fast with a clear message when critical env is missing in production
(currently only Stripe checkout guards this).

---

## C. Performance

### C1. ✅ Landing-page perf (done)
LCP 4.5→4.0s (h1 transform-only), TBT 6.9→0.2s (CSS-compositor decorations),
TTI 13→4.5s, lazy sandbox (−440 lines page.tsx), tightened Lighthouse budgets.

### C2. `library/upload` — stop 1GB in-memory buffering (P1) ✅
The live upload path was already streaming: `useCloudSync` multipart-uploads
via presigned per-part PUTs (10 MB, retried), so the server never holds the
file. The old `POST /api/library/upload` (whole-file `formData` + `Buffer` in
memory) had zero callers — removed it and its tests. Its 1 GB cap now lives on
the live path (`multipart/init` → 413) with 5 new route tests (auth, fields,
size cap, ownership, presigned response). Client-side magic-byte validation
(`validateComicArchive`, pipeline step 1) still guards format integrity.

### C3. User-search N+1 (~30 queries) (P1)
`/api/users/search` batches friend lookups; currently a query per result.

### C4. DMs: unbounded history + 5s polling (P2)
Cursor pagination for message history; replace polling with SSE/push or
long-poll (user-facing latency + cost).

### C5. Landing `content-visibility: auto` (P2)
Below-fold sections with `contain-intrinsic-size` (CLS-safe) to cut initial
render cost as the page grows.

### C6. Reader preloading (P2)
Preload the next page's image while reading (single-page + guided view).

---

## D. Testing

### D1. ✅ Route-test infrastructure + first suites (done)
`src/test/api-helpers.ts`; storage/download, comics/[id]/download, progress
throttle, webhook hardening — 163+ tests.

### D2. Next route-test batch (P1)
`library/upload` (with C2), `comics/[id]` CRUD, `bookmarks`, `collections/[id]/items`,
`favorite`, auth `reset-password*` (partially covered) — ~34 routes still untested.

### D3. E2E expansion (P2)
- Reader flow with real page-turn + progress persistence
- Upload flow against mock S3 (existing `MOCK_S3=1` dev server)
- Badge/streak earn flows

### D4. ✅ e2e suite green + isolated (done)
38/38, chromium + webkit, SQLite-isolated from prod, warm-up global setup.

---

## E. Architecture / Code quality

### E1. Kill the remaining `any`s (~100) (P1) ✅
Worst offenders: `ReaderViewport` (done), `page.tsx` sandbox remnants, route
handlers (`(subscription as any)` — done in webhook), DashboardLayout
`comics as any`/`collections as any`. Add `no-explicit-any` to eslint.
Zero `any` left in production code (was ~100): typed `matchConditions`
(`Prisma.ComicCommentWhereInput[]`), the library search filters + DTO mapping
(no more `mappedComics as any`), cache store (`CacheEntry<unknown>`),
`withAuth` generics (`unknown` defaults), logger meta (`Record<string, unknown>`),
icon map (`LucideIcon`), shared `BeforeInstallPromptEvent` type, SW
`__WB_MANIFEST`/sync handler, and the Stripe pinned API version
(`@ts-expect-error`, the SDK's documented pattern). `no-explicit-any` is now
an eslint **error** for production code (off only in test files).
incrementally (allowlist → zero).

### E2. Duplication extraction (P2)
- ~5 duplicated formatters/date utils
- PWA detection ×2, drag-drop handlers ×4, notification-card markup ×3

### E3. Shared schemas/types (P2) ✅
Route request/response types via zod (`src/types/schemas.ts` exists — extend
to storage, bookmarks, friends, DMs) so clients and servers share contracts.
Done for the friends/DM family: `SendMessageSchema`, `FriendRequestActionSchema`,
`ReactToActivitySchema`, `PostCommentSchema` + `parseJsonBody`/`badRequest`
helpers in `src/lib/api-validation.ts` applied to messages POST, request
accept/decline PUT, feed react POST, comments POST.

### E4. Error-handling consistency (P2) ✅
Standardize route error middleware (auth → 401, ownership → 403/404, zod → 400,
else 500 + logged) — many routes roll their own. Validation failures now go
through the shared `parseJsonBody` → `{ error }` 400 path; the friends/DM/react/
comments routes no longer roll their own body checks.

---

## Priority quick-glance

| Priority | Items |
|---|---|
| **P0** | (none remaining — security-critical + user-data paths are hardened) |
| **P1** | B2 (dep upgrades), B3 (rate-limit/auth), B4 (SMTP), C2 (upload buffering + tests), C3 (search N+1), D2 (route tests), E1 (any's), A2 (accent decision), A4 (god files) |
| **P2** | A3 (cn), A5–A8 (reader/landing/theme/PWA UX), B5, B6, C4–C6, D3, E2–E4 |
