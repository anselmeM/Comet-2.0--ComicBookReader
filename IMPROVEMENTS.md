# Post-Audit Improvement Recommendations

**Date:** 2026-04-20  
**Context:** Authentication bug fix (session persistence) completed. Technical debt identified.

---

## 🛡️ Security (Priority Order)

| Priority | Recommendation | Effort | Rationale |
|----------|---------------|--------|-----------|
| **P1** | Add `AUTH_SECRET` runtime validation in [`src/auth.ts`](src/auth.ts:6) | Low | Fail fast if env var missing - prevents silent auth failures |
| **P1** | Add JWT `iss`/`aud` claims validation in [`src/auth.config.ts`](src/auth.config.ts:29) | Medium | Prevents token confusion attacks between environments |
| **P2** | Apply rate limiting to login endpoint | Medium | `rate-limit.ts` exists but not used on `/api/auth/signin` |
| **P2** | Implement session rotation on login | High | Invalidate old tokens to prevent session fixation |
| **P3** | Add CSRF nonce verification in middleware | Medium | Protect AJAX requests against CSRF |

---

## ⚡ Performance (Priority Order)

| Priority | Recommendation | Rationale |
|----------|---------------|-----------|
| **P1** | Add session caching in middleware | Avoid JWT decode on every protected route hit |
| **P1** | Fix N+1 queries in library API | `findMany` without `include` causes lazy loading |
| **P2** | Implement streaming parse for large uploads | Current: memory buffer; Proposed: chunked |
| **P2** | Add `next/image` for comic covers | Blur placeholders reduce perceived load time |
| **P3** | Pre-cache pages in Service Worker | Background cache authenticated pages |

---

## 🎨 User Experience (Priority Order)

| Priority | Recommendation | Rationale |
|----------|---------------|-----------|
| **P1** | Session expired modal instead of redirect | [`useComicParser.ts:131`](src/hooks/useComicParser.ts:131) hard-redirects to login |
| **P1** | Skeleton loading states for library | Only spinner exists; skeletons improve perceived speed |
| **P2** | Per-page thumbnail progress during upload | Show extracted page previews as parsing progresses |
| **P2** | Retry buttons on API errors | 401/500 responses lack recovery UX |
| **P3** | Offline sync indicator improvements | IndexedDB state vs server state visually unclear |

---

## 🔧 Maintainability (Priority Order)

| Priority | Recommendation | Rationale |
|----------|---------------|-----------|
| **P1** | Fix empty test files | [`src/lib/__tests__/hash.test.ts`](src/lib/__tests__/hash.test.ts) has 0 tests |
| **P1** | Replace `(user as any)` casts | [`auth.ts:39`](src/auth.ts:39) uses unsafe type assertions |
| **P1** | Create `useAuthCallback` hook | 401 handling scattered across [`useComicParser.ts:131`](src/hooks/useComicParser.ts:131), [`useComicPages.ts:66`](src/hooks/useComicPages.ts:66) |
| **P2** | Remove `mockData.ts` if unused | [`src/components/organisms/Dashboard/mockData.ts`](src/components/organisms/Dashboard/mockData.ts) may be dead code |
| **P2** | Create `ApiResponse<T>` wrapper type | API routes lack consistent response envelope |
| **P3** | Sync `schema.prisma` with `schema.postgresql.prisma` | Drift may cause production issues |

---

## ✨ Feature Enhancement (Priority Order)

| Priority | Recommendation | Effort |
|----------|---------------|--------|
| **P1** | Auto-save reading position every 30s | Low - modify [`useReadingProgress.ts`](src/hooks/useReadingProgress.ts) |
| **P2** | Batch import with queue UI | High - requires new upload manager component |
| **P2** | Reading streaks gamification | Medium - new user preference field + UI badge |
| **P3** | Complete social features | `friends`, `notifications`, `community` APIs incomplete |
| **P3** | PDF export for reading notes | Medium - new export route |

---

## 📋 Recommended Implementation Order

### Phase 1 (This Week)
1. Add `AUTH_SECRET` validation to [`src/auth.ts`](src/auth.ts:6)
2. Create `useAuthCallback` hook for centralized 401 handling
3. Add skeleton loading to library page

### Phase 2 (This Sprint)
4. Add JWT `iss`/`aud` claims in [`src/auth.config.ts`](src/auth.config.ts:29)
5. Apply rate limiting to login endpoint
6. Fix N+1 queries in library API

### Phase 3 (Next Sprint)
7. Add middleware session caching
8. Implement session expired modal UX
9. Add proper test coverage for auth callbacks

### Phase 4 (Future)
10. Batch import UI
11. Social features completion
12. PDF export

---

## Technical Debt Summary

- **Critical:** Empty test suites, `(user as any)` casts, scattered 401 handling
- **High:** Rate limiting gaps, N+1 queries, missing session rotation
- **Medium:** UX gaps (skeletons, modals), image optimization
- **Low:** Dead code cleanup, schema drift

**Estimated full cleanup:** 3-4 sprints