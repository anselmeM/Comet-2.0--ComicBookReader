# Comet 2.0 — Implementation Plan

**Version:** 1.0.0  
**Last Updated:** 2026-04-17  
**Reference:** [design.md](./design.md), [tasks.md](./tasks.md)  

---

## Table of Contents

1. [Plan Overview](#1-plan-overview)
2. [Milestone Structure](#2-milestone-structure)
3. [Milestone 1: Foundation & Authentication](#3-milestone-1-foundation--authentication)
4. [Milestone 2: Core Library Features](#4-milestone-2-core-library-features)
5. [Milestone 3: Comic Reader](#5-milestone-3-comic-reader)
6. [Milestone 4: Offline & PWA](#6-milestone-4-offline--pwa)
7. [Milestone 5: Bookmarks & Progress](#7-milestone-5-bookmarks--progress)
8. [Milestone 6: Polish & UX Enhancements](#8-milestone-6-polish--ux-enhancements)
9. [Milestone 7: Production Infrastructure](#9-milestone-7-production-infrastructure)
10. [Dependency Matrix](#10-dependency-matrix)
11. [Priority Justification](#11-priority-justification)

---

## 1. Plan Overview

### 1.1 Objectives

This implementation plan decomposes the Comet 2.0 project into seven sequential milestones, each delivering a working, deployable increment of the system. The plan ensures:

- **Critical path clarity**: P0 tasks are clustered in early milestones
- **Dependency compliance**: Tasks are sequenced to respect technical dependencies
- **Working increments**: Each milestone produces a testable, deployable system
- **Risk mitigation**: High-complexity tasks are spread across milestones with buffer time

### 1.2 Timeline Summary

| Milestone | Duration | Total Hours | Key Deliverables |
|-----------|----------|-------------|------------------|
| M1: Foundation & Auth | 2 weeks | 70h | Complete auth, secure API |
| M2: Core Library | 2 weeks | 68h | Upload, parse, browse library |
| M3: Comic Reader | 3 weeks | 78h | Full reading experience |
| M4: Offline & PWA | 2 weeks | 48h | Service worker, offline reading |
| M5: Bookmarks & Progress | 2 weeks | 64h | Progress sync, bookmarks |
| M6: Polish & UX | 2 weeks | 55h | Settings, themes, search |
| M7: Production Infra | 3 weeks | 128h | PostgreSQL, CI/CD, scale |
| **Total** | **16 weeks** | **511h** | Production-ready system |

### 1.3 Team Assumptions

- **Team Size**: 1-2 developers
- **Working Hours**: 20-30h/week per developer
- **Sprints**: Bi-weekly iterations within milestones

---

## 2. Milestone Structure

Each milestone follows this template:

```typescript
interface Milestone {
  id: string;                    // M1, M2, etc.
  name: string;                  // Descriptive name
  objectives: string[];          // What this milestone achieves
  tasks: Task[];                 // Tasks from tasks.md
  dependencies: string[];        // Prior milestone IDs
  timeline: {
    startDate: string;           // ISO date
    endDate: string;             // ISO date
    weeks: number;
  };
  definitionOfDone: string[];    // Exit criteria
  riskFactors: string[];         // Known risks
}
```

---

## 3. Milestone 1: Foundation & Authentication

**Duration:** 2 weeks (2026-04-21 to 2026-05-04)  
**Total Hours:** 70h (4h/day average)  
**Priority Justification:** Authentication is the foundation of all security. Without secure auth, no user data can be protected. This milestone addresses critical security debt identified in production readiness.

### 3.1 Objectives

1. Complete user registration with proper validation
2. Implement password reset flow
3. Add rate limiting to prevent brute force attacks
4. Secure all API routes with authentication checks
5. Establish Zod validation patterns for all API inputs

### 3.2 Tasks

| Task ID | Title | Hours | Priority | Dependencies |
|---------|-------|-------|----------|--------------|
| T-AUTH-001 | User Registration API | 4h | P0 | None |
| T-AUTH-002 | Password Reset Flow | 8h | P0 | T-AUTH-001 |
| T-AUTH-003 | Rate Limiting | 6h | P1 | T-AUTH-001 |
| T-AUTH-004 | Session Refresh Tokens | 16h | P1 | T-AUTH-001, T-AUTH-002 |
| — | API Route Security Audit | 8h | P0 | T-AUTH-001 |
| — | Input Validation Patterns | 8h | P0 | T-AUTH-001 |
| — | Error Handling Standardization | 6h | P1 | None |
| — | Auth Testing Suite | 14h | P1 | All above |

**Total:** 70h

### 3.3 Definition of Done

- [ ] New users can register with email/password
- [ ] Users can log in and receive JWT session
- [ ] Password reset flow works end-to-end
- [ ] Rate limiting triggers at defined thresholds
- [ ] All `/api/*` routes return 401 without valid session
- [ ] All input validated with Zod before processing
- [ ] Auth unit tests pass with >80% coverage
- [ ] No hardcoded secrets in codebase

### 3.4 Risk Factors

- **Risk:** Bcrypt cost factor may cause slowdowns at scale  
  **Mitigation:** Start with cost=10, profile before increasing
- **Risk:** JWT refresh logic complexity  
  **Mitigation:** Implement basic JWT first, add refresh as separate PR

---

## 4. Milestone 2: Core Library Features

**Duration:** 2 weeks (2026-05-05 to 2026-05-18)  
**Total Hours:** 68h  
**Priority Justification:** Library management is the primary user-facing feature. Users cannot read comics without uploading them first.

### 4.1 Objectives

1. Implement comic file upload with drag-and-drop
2. Client-side comic parsing with Web Worker
3. SHA-256 hash generation for deduplication
4. Cover image extraction and thumbnail generation
5. Library display with pagination
6. Comic deletion with cleanup

### 4.2 Tasks

| Task ID | Title | Hours | Priority | Dependencies |
|---------|-------|-------|----------|--------------|
| T-LIB-001 | Comic File Validation | 2h | P0 | None |
| T-LIB-002 | SHA-256 File Hash | 4h | P0 | None |
| T-LIB-003 | Cover Image Extraction | 6h | P0 | T-LIB-001 |
| T-LIB-004 | Library Pagination | 4h | P1 | T-AUTH-001 (API) |
| T-LIB-005 | Library Search & Filter | 12h | P2 | T-LIB-004 |
| T-LIB-006 | Bulk Delete Operations | 8h | P2 | T-LIB-004 |
| — | Comic Card Component Polish | 8h | P1 | None |
| — | Upload Progress UI | 6h | P1 | T-LIB-001 |
| — | Library API Optimization | 10h | P1 | T-LIB-004 |
| — | Integration Testing | 8h | P1 | All above |

**Total:** 68h

### 4.3 Definition of Done

- [ ] Users can upload .cbz and .zip files via drag-and-drop
- [ ] Files >100MB rejected with clear error
- [ ] SHA-256 hash computed before upload
- [ ] Duplicate files detected and handled gracefully
- [ ] Cover thumbnail displayed in library grid
- [ ] Library paginated (20 items/page)
- [ ] Comics can be deleted (removed from DB and IndexedDB)
- [ ] Upload progress shown to user

### 4.4 Risk Factors

- **Risk:** Large file parsing may crash browser  
  **Mitigation:** Stream processing in worker, chunk-based hashing
- **Risk:** IndexedDB quota exceeded  
  **Mitigation:** Implement LRU eviction, show storage usage

---

## 5. Milestone 3: Comic Reader

**Duration:** 3 weeks (2026-05-19 to 2026-06-08)  
**Total Hours:** 78h  
**Priority Justification:** The reader is the core product experience. All other features exist to support reading. This milestone implements all reading modes and navigation.

### 5.1 Objectives

1. Fix and verify page navigation (keyboard + touch)
2. Implement single-vertical mode for mobile
3. Implement dual-spread mode for desktop
4. Implement manga RTL reading mode
5. Implement guided view panel detection
6. Add zoom controls (pinch + buttons)
7. Implement fullscreen mode
8. Save reading preferences per comic

### 5.2 Tasks

| Task ID | Title | Hours | Priority | Dependencies |
|---------|-------|-------|----------|--------------|
| T-READ-001 | Page Navigation Fix | 2h | P0 | None |
| T-READ-002 | Dual-Spread Mode | 8h | P0 | T-READ-001 |
| T-READ-003 | Manga RTL Mode | 6h | P1 | T-READ-002 |
| T-READ-004 | Guided View Panel Detection | 20h | P1 | T-READ-001 |
| T-READ-005 | Zoom Controls | 4h | P1 | None |
| T-READ-006 | Fullscreen Mode | 3h | P1 | T-READ-001 |
| T-READ-007 | Reading Mode Persistence | 8h | P2 | T-READ-002, T-READ-003 |
| T-READ-008 | Double-Page Center Fold | 6h | P2 | T-READ-002 |
| — | Reader Keyboard Shortcuts | 6h | P1 | T-READ-001 |
| — | Reader Touch Gestures | 6h | P1 | T-READ-001 |
| — | Reader Performance Optimization | 5h | P1 | T-READ-002 |
| — | Reader Testing & Bug Fixes | 4h | P0 | All above |

**Total:** 78h

### 5.3 Definition of Done

- [ ] Arrow keys navigate pages correctly
- [ ] Space advances to next page
- [ ] Home/End jump to first/last page
- [ ] Mobile shows single-vertical scrolling
- [ ] Desktop shows dual-page spread
- [ ] RTL mode reverses page order
- [ ] Guided view zooms to detected panels
- [ ] Pinch-to-zoom works on touch devices
- [ ] F key toggles fullscreen
- [ ] ESC exits fullscreen
- [ ] Reading preferences saved per comic

### 5.4 Risk Factors

- **Risk:** Guided view panel detection is slow on large images  
  **Mitigation:** Run detection in worker, cache results, show loading skeleton
- **Risk:** Touch gesture conflicts with browser gestures  
  **Mitigation:** Use passive listeners, handle preventDefault carefully

---

## 6. Milestone 4: Offline & PWA

**Duration:** 2 weeks (2026-06-09 to 2026-06-22)  
**Total Hours:** 48h  
**Priority Justification:** Offline-first is a key differentiator. Without PWA, users lose access when network fails.

### 6.1 Objectives

1. Fix service worker registration and caching strategy
2. Implement comic page caching in IndexedDB
3. Add PWA update notification
4. Implement background sync for progress updates
5. Ensure offline reading works for cached comics

### 6.2 Tasks

| Task ID | Title | Hours | Priority | Dependencies |
|---------|-------|-------|----------|--------------|
| T-PWA-001 | Service Worker | 8h | P0 | None |
| T-PWA-002 | Comic Page Caching | 8h | P0 | T-LIB-003, T-READ-001 |
| T-PWA-003 | PWA Update Notification | 4h | P2 | T-PWA-001 |
| T-PWA-004 | Background Sync | 24h | P2 | T-PWA-002, T-BM-001 |
| — | Offline Detection UI | 4h | P1 | T-PWA-001 |

**Total:** 48h

### 6.3 Definition of Done

- [ ] PWA installable on Chrome, Safari, Edge, Firefox
- [ ] App loads offline from cache
- [ ] Previously read comics readable offline
- [ ] Service worker updates when new version deployed
- [ ] Toast shown when new version available
- [ ] Background sync queues progress when offline
- [ ] Sync completes when connection restored

### 6.4 Risk Factors

- **Risk:** Service worker caching conflicts with real-time data  
  **Mitigation:** Network-first for API, cache-first for static
- **Risk:** IndexedDB storage quota varies by browser  
  **Mitigation:** Detect quota, show warning, implement cleanup

---

## 7. Milestone 5: Bookmarks & Progress

**Duration:** 2 weeks (2026-06-23 to 2026-07-06)  
**Total Hours:** 64h  
**Priority Justification:** Progress tracking and bookmarks are high-value features for reader retention. They enable "pick up where I left off" and "favorite moments."

### 7.1 Objectives

1. Complete bookmark CRUD API
2. Add bookmark toggle to reader
3. Implement bookmark panel in reader
4. Allow bookmark labels/notes
5. Persist reading progress to database
6. Restore progress when reopening comics

### 7.2 Tasks

| Task ID | Title | Hours | Priority | Dependencies |
|---------|-------|-------|----------|--------------|
| T-BM-001 | Bookmark CRUD API | 4h | P0 | T-AUTH-001 |
| T-BM-002 | Bookmark UI in Reader | 8h | P1 | T-BM-001, T-READ-001 |
| T-BM-003 | Bookmark Labels | 4h | P2 | T-BM-002 |
| T-BM-004 | Progress WebSocket Sync | 40h | P3 | T-BM-001 |
| — | Progress Save on Navigate | 4h | P0 | T-BM-001 |
| — | Progress Restore on Open | 4h | P0 | T-BM-001 |

**Total:** 64h

### 7.3 Definition of Done

- [ ] Bookmarks persist to database
- [ ] Toggle bookmark via button in reader
- [ ] Bookmark panel shows all bookmarks for comic
- [ ] Tap bookmark to navigate to page
- [ ] Add/edit labels on bookmarks
- [ ] Reading progress saved on page change
- [ ] Reopening comic restores last position
- [ ] Progress synced across sessions (WebSocket if time permits)

### 7.4 Risk Factors

- **Risk:** WebSocket sync is complex and may delay milestone  
  **Mitigation:** Make WebSocket optional for M5; implement polling fallback first
- **Risk:** Too many progress updates may throttle  
  **Mitigation:** Debounce progress saves to once per 5 seconds

---

## 8. Milestone 6: Polish & UX Enhancements

**Duration:** 2 weeks (2026-07-07 to 2026-07-20)  
**Total Hours:** 55h  
**Priority Justification:** After core features, polish differentiates good from great. Settings and themes improve retention and accessibility.

### 8.1 Objectives

1. Implement reading mode preferences in settings
2. Add display theme options (dark, light, sepia)
3. Complete account profile management
4. Add library search and filtering
5. Implement collections/folders

### 8.2 Tasks

| Task ID | Title | Hours | Priority | Dependencies |
|---------|-------|-------|----------|--------------|
| T-SET-001 | Reading Mode Preferences | 3h | P1 | T-READ-002 |
| T-SET-002 | Display Theme Settings | 4h | P2 | None |
| T-SET-003 | Account Profile Management | 8h | P1 | T-AUTH-001 |
| T-SET-004 | Import/Export Library | 24h | P3 | T-LIB-004 |
| T-LIB-005 | Library Search & Filter | 12h | P2 | T-LIB-004 |
| T-LIB-007 | Collections/Folders | 24h | P3 | T-LIB-004 |
| — | Settings Page UI Polish | 8h | P1 | T-SET-001 |
| — | Empty States & Error Handling | 6h | P1 | All above |

**Total:** 85h (prioritized subset: 55h)

### 8.3 Definition of Done

- [ ] Default reading mode configurable in settings
- [ ] Theme selection (dark/light/sepia) works
- [ ] Brightness slider adjusts reader brightness
- [ ] Users can update name, email, avatar
- [ ] Users can change password
- [ ] Library search with debounce works
- [ ] Filter by series, year, read status works
- [ ] Basic collections UI functional (if T-LIB-007 included)

### 8.4 Risk Factors

- **Risk:** Scope creep from UX improvements  
  **Mitigation:** Prioritize ruthlessly; defer T-LIB-007 and T-SET-004 if needed
- **Risk:** Theme changes may break reader contrast  
  **Mitigation:** Test all themes with accessibility checker

---

## 9. Milestone 7: Production Infrastructure

**Duration:** 3 weeks (2026-07-21 to 2026-08-10)  
**Total Hours:** 128h  
**Priority Justification:** Infrastructure is required for production deployment. Without this, the app cannot scale beyond a single-user development instance.

### 9.1 Objectives

1. Migrate from SQLite to PostgreSQL
2. Configure production environment variables
3. Set up CI/CD pipeline with GitHub Actions
4. Implement API response caching (Redis)
5. Run load testing for 1000 concurrent users
6. Security audit and hardening

### 9.2 Tasks

| Task ID | Title | Hours | Priority | Dependencies |
|---------|-------|-------|----------|--------------|
| T-INF-001 | PostgreSQL Migration | 32h | P0 | None (but late in plan) |
| T-INF-002 | Production Env Config | 8h | P0 | None |
| T-INF-003 | CI/CD Pipeline | 24h | P1 | T-INF-002 |
| T-INF-004 | API Response Caching | 16h | P1 | T-INF-001 |
| T-INF-005 | Load Testing | 24h | P2 | T-INF-003 |
| — | Security Audit | 16h | P0 | T-AUTH-003 |
| — | Documentation Finalization | 8h | P1 | All above |

**Total:** 128h

### 9.3 Definition of Done

- [ ] PostgreSQL schema deployed and tested
- [ ] All environment variables documented in .env.example
- [ ] CI pipeline runs on PR and main branch
- [ ] CD deploys to staging on main, production on release tag
- [ ] Redis caching active for library and comic endpoints
- [ ] Load test validates 1000 concurrent users
- [ ] No critical security vulnerabilities (as per audit)
- [ ] README updated with production deployment instructions

### 9.4 Risk Factors

- **Risk:** PostgreSQL migration data loss  
  **Mitigation:** Full backup before migration, validate checksum after
- **Risk:** Load testing reveals fundamental scaling issues  
  **Mitigation:** Address bottlenecks incrementally; may require additional milestone
- **Risk:** CI/CD complexity exceeds estimates  
  **Mitigation:** Use Vercel/Railway managed deployments vs self-hosted

---

## 10. Dependency Matrix

### 10.1 Inter-Task Dependencies

```
T-AUTH-001 (Registration)
    │
    ├── T-AUTH-002 (Password Reset)
    │       └── T-AUTH-004 (Session Refresh) ──────────────────┐
    │               └── T-AUTH-003 (Rate Limiting)            │
    │                       └── API Route Security Audit        │
    │                                                           │
    ├── T-BM-001 (Bookmark API)                                 │
    │       ├── T-BM-002 (Bookmark UI)                         │
    │       │       └── T-BM-003 (Bookmark Labels)              │
    │       └── T-BM-004 (WebSocket Sync)                       │
    │               └── T-PWA-004 (Background Sync)              │
    │                                                           │
    └── T-SET-003 (Profile Management)                          │
            └── T-SET-001 (Reading Preferences)                │
                    └── T-SET-002 (Theme Settings)              │
                                                           │
T-LIB-001 (File Validation)                                    │
    │                                                           │
    ├── T-LIB-002 (SHA-256 Hash)                                │
    │       └── T-LIB-003 (Cover Extraction)                    │
    │               └── T-PWA-002 (Page Caching)                │
    │                       └── T-PWA-001 (Service Worker) ─────┘
    │
    └── T-LIB-004 (Pagination)
            ├── T-LIB-005 (Search & Filter)
            ├── T-LIB-006 (Bulk Delete)
            └── T-LIB-007 (Collections)
                    └── T-SET-004 (Import/Export)

T-READ-001 (Navigation)
    │
    ├── T-READ-002 (Dual-Spread)
    │       ├── T-READ-003 (Manga RTL)
    │       │       └── T-READ-007 (Mode Persistence)
    │       └── T-READ-008 (Center Fold)
    │
    ├── T-READ-004 (Guided View)
    │
    ├── T-READ-005 (Zoom Controls)
    │
    └── T-READ-006 (Fullscreen)

T-INF-001 (PostgreSQL)
    │
    ├── T-INF-002 (Env Config)
    │       └── T-INF-003 (CI/CD)
    │               └── T-INF-005 (Load Testing)
    │
    └── T-INF-004 (API Caching)
```

### 10.2 Dependency Chain Summary

| Phase | Critical Path | Total Days |
|-------|---------------|------------|
| Auth | T-AUTH-001 → T-AUTH-002 → T-AUTH-003 → API Audit | 12 days |
| Library | T-LIB-001 → T-LIB-002 → T-LIB-003 → T-LIB-004 | 8 days |
| Reader | T-READ-001 → T-READ-002 → T-READ-003 → T-READ-004 | 18 days |
| Offline | T-PWA-001 → T-PWA-002 → T-PWA-003/T-PWA-004 | 12 days |
| Infra | T-INF-001 → T-INF-002 → T-INF-003 → T-INF-005 | 21 days |

---

## 11. Priority Justification

### 11.1 Why P0 Tasks Come First

| Priority | Reasoning |
|----------|-----------|
| **P0** | Security vulnerabilities and data corruption risks must be eliminated before user growth. Auth bugs can expose user data. |
| **P1** | Core user flows must work flawlessly. Reading and bookmarking are primary retention drivers. |
| **P2** | Enhancement features improve experience but don't block usage. Can iterate post-launch. |
| **P3** | Nice-to-have features. Valuable but can be added incrementally after reaching product-market fit. |

### 11.2 Complexity Risk Mitigation

| Complexity | Strategy |
|------------|----------|
| **Critical** (40h+) | Split across multiple milestones, start early |
| **High** (16-40h) | Allocate dedicated sprint time, avoid parallel execution |
| **Medium** (4-16h) | Standard sprint allocation |
| **Low** (1-4h) | Batch together in same sprint |

### 11.3 Buffer Allocation

Each milestone includes 15% buffer time for:
- Unexpected bugs and investigation
- Code review feedback cycles
- Environment setup and configuration
- Documentation updates

**Buffer = 511h × 0.15 = 77h additional**

**Adjusted Total = 588h (approximately 20 weeks for 1 developer at 30h/week)**

---

## Appendix A: Milestone Timeline Calendar

```
2026
├── April
│   └── 21: M1 Start
├── May
│   ├── 4:  M1 End (Foundation)
│   ├── 5:  M2 Start
│   ├── 18: M2 End (Library)
│   ├── 19: M3 Start
│   ├── 8:  M3 End (Reader) ← spans 3 weeks
│   └── 9:  M4 Start
├── June
│   ├── 22: M4 End (Offline/PWA)
│   ├── 23: M5 Start
│   ├── 6:  M5 End (Bookmarks)
│   ├── 7:  M6 Start
│   ├── 20: M6 End (Polish)
│   ├── 21: M7 Start
│   └── 10: M7 End (Infrastructure) ← spans 3 weeks
└── August
    └── 10: M7 End + Production Launch Ready
```

---

## Appendix B: Milestone Definition of Done Checklist

### Common to All Milestones

- [ ] All P0 tasks completed and tested
- [ ] No new critical bugs introduced
- [ ] Code passes lint and type checks
- [ ] Documentation updated for changed components
- [ ] Team review completed
- [ ] Deployment to staging verified

### Pre-M7 (Pre-Production) Checklist

- [ ] All auth flows tested with test accounts
- [ ] Library upload/delete tested with >50 comics
- [ ] Reader tested in all modes (single, dual, RTL, guided)
- [ ] Offline reading verified (airplane mode)
- [ ] Bookmarks persist across sessions
- [ ] Settings changes apply immediately

---

**Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-17 | Architect | Initial implementation plan |
