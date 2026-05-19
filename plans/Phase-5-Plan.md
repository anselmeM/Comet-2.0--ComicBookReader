# Implementation Plan - Phase 5: Production Readiness & Optimization

This plan covers the final phase of the Comet 2.0 evolution, focusing on infrastructure scaling and enhanced user experience.

## 1. Infrastructure Scaling (Task 12)

### 1.1 PostgreSQL Migration (Task 12.1)
- **Status:** Mostly complete.
- **Action:** 
  - Verify `prisma/schema.prisma` uses `postgresql` provider.
  - Ensure `scripts/prisma-provider-switch.js` is correctly integrated into the build process.
  - Document Neon connection requirements in `.env.example`.

### 1.2 Redis Caching & Rate Limiting (Tasks 12.2 & 12.3)
- **Goal:** Replace in-memory `Map` stores with `@upstash/redis` for serverless-friendly persistence and scalability.
- **Action:**
  - Install `@upstash/redis` and `@upstash/ratelimit`.
  - Refactor `src/lib/cache.ts`:
    - Use `Redis` client for `getCache`, `setCache`, and `invalidateCache`.
  - Refactor `src/lib/rate-limit.ts`:
    - Use `Ratelimit` from `@upstash/ratelimit`.
    - Maintain backward compatibility with the existing `rateLimit(key, limit, windowMs)` signature.

## 2. Enhanced UX & Analytics (Task 13)

### 2.1 Reading Statistics (Task 13.1)
- **Goal:** Track total time spent reading per comic and count completed comics.
- **Action:**
  - **Client-side (`src/hooks/useReadingProgress.ts`):**
    - Implement a timer that tracks active reading time (seconds).
    - Pause timer when `document.visibilityState !== 'visible'`.
    - Include `timeDelta` (seconds since last sync) in the `PUT /api/comics/[id]/progress` payload.
  - **Backend (`src/app/api/comics/[id]/progress/route.ts`):**
    - Update `ReadingProgress` to increment `totalTimeSpent` by `timeDelta`.
    - Ensure `readStatus` transition to `COMPLETED` is tracked.

### 2.2 User Streaks (Task 13.2)
- **Goal:** Implement daily reading streaks and milestones.
- **Action:**
  - **Backend (`src/app/api/comics/[id]/progress/route.ts`):**
    - On every progress update, check the user's `lastReadDate`.
    - If `lastReadDate` is *yesterday*: Increment `readingStreak`.
    - If `lastReadDate` is *today*: Keep current `readingStreak`.
    - If `lastReadDate` is *older than yesterday*: Reset `readingStreak` to 1.
    - Update `lastReadDate` to today.

### 2.3 Global Search (Task 13.3)
- **Goal:** Implement cross-collection search with `Fuse.js`.
- **Action:**
  - Install `fuse.js`.
  - Create `src/lib/search.ts` utility:
    - Index Comics, Collections, and Series.
  - Update `DashboardLayout.tsx`:
    - Use `Fuse.js` for local searching across the pre-fetched data.
    - Group results by category.

## 3. Dependencies
- `@upstash/redis`
- `@upstash/ratelimit`
- `fuse.js`

## 4. Verification Plan
- **Automated Tests:** Add unit tests for streak logic and search utility.
- **Manual Verification:**
  - Verify rate limit headers in API responses.
  - Verify reading time increments in Prisma Studio.
  - Verify streak behavior by mocking dates.
  - Verify search results accuracy.
