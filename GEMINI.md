# GEMINI.md — Comet Project Memory

> **"The Speed of Light Comic Reader."**
> Persistent knowledge file for all Antigravity sub-agents working on the Comet PWA.
> Last updated: 2026-03-12

---

## 1. Project Identity

| Key | Value |
|---|---|
| **Product Name** | Comet |
| **Tagline** | The Speed of Light Comic Reader |
| **Core Value** | Seamless offline mobile reading ↔ high-res desktop library management |
| **Target Platforms** | iOS Safari (PWA), Android Chrome (PWA), Desktop Chrome/Firefox |
| **Repo Root** | `c:\Users\amotc\Documents\GitHub\Comet 2.0--ComicBookReader` |

---

## 2. Tech Stack & Strict Rules

### Frontend
- **Framework**: Next.js App Router (no Pages Router)
- **Language**: TypeScript — `strict: true` always. No `any`, no `@ts-ignore`.
- **Styling**: Tailwind CSS (JIT). No inline styles, no CSS Modules unless necessary for canvas.
- **Animation**: Framer Motion — page turns, panel transitions, skeleton loading.
- **Icons**: `lucide-react` only.

### State Management
- **UI / Local State**: Zustand with `persist` middleware → `localStorage`
- **Server / Remote State**: TanStack Query (`staleTime: 5min`, background refetch on focus)
- **Rule**: Never use `useState` for data that should survive a page refresh. Use Zustand.

### PWA / Offline Strategy
- **Service Worker**: Workbox (via `@ducanh2912/next-pwa`) with `InjectManifest` mode
- **App Shell** (HTML, JS, CSS, fonts): `CacheFirst` — pre-cached at SW install
- **API Routes** (`/api/*`): `NetworkFirst` with stale-while-revalidate fallback
- **Comic Pages** (blob ObjectURLs): Managed by IndexedDB, NOT the SW cache
- **Background Sync**: Queue failed `PUT /api/comics/:id/progress` when offline

### File Handling — CRITICAL
- `.cbz` → parsed with `jszip` in a **Web Worker** (`src/workers/comicParser.worker.ts`)
- `.cbr` → parsed with `unrar.js` (WASM) in the same Web Worker, then re-packed to ZIP
- **The main thread MUST NEVER be blocked by decompression.** Target: 60fps at all times.
- Worker posts progress events: `{ type: 'PROGRESS', page: N, total: M }`
- Files are parsed **client-side only**. No files are uploaded to any server.

### Database
- **ORM**: Prisma ORM
- **Database**: PostgreSQL (Neon serverless in production)
- **Auth**: Auth.js v5 (`next-auth@beta`) with Prisma adapter
- **Sessions**: JWT, 30-day expiry

### Security
- CSP headers enforced in `next.config.ts` (nonce-based scripts)
- `worker-src 'self' blob:` — required for Web Workers
- `img-src 'self' blob: data:` — required for comic page ObjectURLs
- File type validated by **magic bytes**, not file extension

---

## 3. Project Structure

```
comet/
├── prisma/
│   └── schema.prisma            # DB schema (User, Comic, ReadingProgress)
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # PWA icon set (192, 512, maskable)
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, register pages (public)
│   │   ├── (app)/               # Protected routes (require session)
│   │   │   ├── library/         # Comic grid, upload dropzone
│   │   │   ├── reader/[comicId]  # ComicReader view
│   │   │   └── settings/        # Reader prefs, storage management
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── library/         # GET list, POST add comic
│   │       └── comics/[id]/
│   │           ├── progress/    # PUT reading progress
│   │           └── enrich/      # GET ComicVine metadata
│   ├── components/
│   │   ├── atoms/               # Button, Icon, Badge, Spinner
│   │   ├── molecules/           # ComicCard, PageThumbnail, ProgressBar
│   │   └── organisms/
│   │       ├── ComicLibrary/    # Full library grid
│   │       ├── ComicReader/     # The reading engine
│   │       └── ReaderControls/  # Mode toggles, zoom, toolbar
│   ├── hooks/                   # useLibrary, useComicParser, useGesture
│   ├── stores/
│   │   └── readerStore.ts       # Zustand: reading mode, page, zoom
│   ├── workers/
│   │   └── comicParser.worker.ts
│   ├── lib/
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── idb.ts               # IndexedDB adapter (idb package)
│   │   ├── lru.ts               # LRU cache eviction logic
│   │   └── comicvine.ts         # ComicVine API client
│   └── types/
│       └── index.ts             # Shared TypeScript types
├── auth.ts                      # Auth.js v5 config
├── middleware.ts                 # Route protection
├── next.config.ts               # PWA plugin, CSP headers
└── GEMINI.md                    # This file
```

---

## 4. Core Schema Reference

### Library Table (Prisma Model: `Comic`)
```ts
{
  id:           string      // cuid()
  userId:       string      // FK → User
  title:        string
  filehash:     string      // SHA-256 (dedup key)
  pageCount:    number
  coverUrl:     string?     // Blob or remote URL
  comicVineId:  string?
  series:       string?
  issue:        number?
  year:         number?
  addedAt:      Date
  lastReadAt:   Date?
  metadata:     JsonB?      // Raw ComicVine enrichment payload
}
```

### ReadingProgress
```ts
{
  comicId:    string      // 1:1 with Comic
  lastPage:   number      // 0-indexed
  totalPages: number
  zoomLevel:  number      // 1.0 = 100%
  readStatus: 'UNREAD' | 'READING' | 'COMPLETED'
}
```

---

## 5. Reader Component Contract

The `<ComicReader>` component **must**:

- Use `transform: scale()` for pinch-to-zoom (via `@use-gesture/react`)
- Use `IntersectionObserver` for lazy-loading high-res page images
- Support 4 reading modes (driven by `useReaderStore`):

| Mode | Viewport | Layout |
|---|---|---|
| `single-vertical` | Mobile `< 768px` | 1 page, scroll down |
| `dual-spread` | Desktop `≥ 1024px` | 2 pages side-by-side |
| `manga-rtl` | User toggle | 2-page, right-to-left |
| `guided-view` | User toggle | Pan between panels |

- Animate page turns with `framer-motion` `AnimatePresence`
- Never exceed **CLS > 0.1** — reserve space for pages before they load

---

## 6. Agentic Behavioral Guidelines

### Performance First
- CLS must be < 0.1 on all pages. Reserve dimensions for images/comics before load.
- `LCP < 2.5s` on 3G Slow throttling.
- Never import a library >50kB without checking if a lighter alternative exists.

### Offline-First Mantra
Before shipping any feature, ask: **"What happens if the user is in a tunnel with no 5G?"**
- Reading progress syncs via Background Sync (not lost if offline)
- Library metadata served from TanStack Query cache
- App shell always available from SW `CacheFirst` cache

### Canvas Rendering Safety
- Always call `canvas.getContext()` with a null check
- Dispose of `ImageBitmap` objects with `.close()` after rendering
- Never create a new `Canvas` element per frame — reuse

### Component Design
- **Atomic Design**: atoms → molecules → organisms. No organism imports another organism.
- All utility functions must have **TSDoc** comments (`@param`, `@returns`, `@example`)
- Functional components only. No class components.

---

## 7. Common Pitfalls — DO NOT DO THESE

| ❌ Pitfall | ✅ Correct Approach |
|---|---|
| `import fs from 'fs'` in a client component | Only use `fs` in Server Components or API routes |
| Storing `ArrayBuffer` in Zustand | Post ArrayBuffer to Web Worker; store only derived ObjectURLs |
| Opening multiple IndexedDB connections | Use the singleton `lib/idb.ts` adapter |
| Canvas memory leak: creating bitmap per page | Call `imageBitmap.close()` when a page is no longer visible |
| Large decompression on main thread | Always dispatch to `comicParser.worker.ts` |
| `useEffect` with missing dependencies | Run `eslint-plugin-react-hooks`; lint errors are build errors |
| Calling `window.*` in a Server Component | Wrap in `typeof window !== 'undefined'` or use `'use client'` |
| Uploading `.cbr`/`.cbz` to the server | Files stay client-side. Only metadata (title, hash, pageCount) hits the API |

---

## 8. Definition of Done

A task is **DONE** only when all of the following pass:

- [ ] **Lint**: `npm run lint` — zero errors, zero warnings
- [ ] **Type Check**: `npx tsc --noEmit` — zero errors
- [ ] **Tests**: All unit tests pass (`npx vitest run`)
- [ ] **Responsive Audit**: Verified at 390px (mobile), 1024px (tablet), 1440px (desktop)
- [ ] **Offline Check**: Feature degrades gracefully when `navigator.onLine === false`
- [ ] **CLS Check**: No layout shift > 0.1 on page load (measure with DevTools Performance tab)
- [ ] **TSDoc**: All new utility functions have TSDoc comments

---

## 9. Environment Variables Required

```bash
# .env.local
DATABASE_URL=                  # Neon Postgres connection string
DIRECT_URL=                    # Neon direct URL (for Prisma migrations)
AUTH_SECRET=                   # Auth.js v5 secret (openssl rand -base64 32)
AUTH_GOOGLE_ID=                # Google OAuth Client ID
AUTH_GOOGLE_SECRET=            # Google OAuth Client Secret
COMICVINE_API_KEY=             # ComicVine API key
NEXT_PUBLIC_APP_URL=           # e.g. http://localhost:3000
```

---

## 10. Commands Reference

```bash
npm run dev          # Start dev server (http://localhost:3100)
npm run build        # Production build
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript check
npx vitest run       # Unit tests
npx prisma db push   # Sync schema to DB (dev)
npx prisma studio    # Visual DB browser
npx playwright test  # E2E browser tests
npx lighthouse http://localhost:3100 --only-categories=performance,pwa
```
