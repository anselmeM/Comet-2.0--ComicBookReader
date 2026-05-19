# Formal Tech Debt Audit & Remediation Roadmap - Comet 2.0

**Date:** 2026-05-17  
**Status:** Strategic Review Complete

---

## 1. Debt Inventory

| ID | Category | Item | Metrics / Indicators | Risk Level |
|----|----------|------|----------------------|------------|
| **D-001** | Code | Monolithic `DashboardLayout.tsx` | 613 lines, 8+ responsibilities | **High** |
| **D-002** | Code | Redundant `ComicCard` Components | 2 similar but divergent implementations | **Medium** |
| **D-003** | Testing | Core Hook Coverage Gap | 0% unit tests for `useLibrary`, `useReadingProgress` | **High** |
| **D-004** | Arch | Fragmented Mock Data | Mock data lives inside component directories | **Low** |
| **D-005** | Infra | Missing Automated Performance Gates | No LCP/CLS checks in CI | **Medium** |

---

## 2. Impact Analysis (ROI)

| ID | Annual Cost (Est.) | Remediation Effort | ROI Projection |
|----|-------------------|--------------------|----------------|
| **D-001** | $12,000 (Velocity) | 3 Sprints | **High** - Prevents regression bugs |
| **D-002** | $4,500 (Maintenance) | 1 Sprint | **Medium** - Improves design consistency |
| **D-003** | $18,000 (Bug fixes) | 4 Sprints | **Very High** - Essential for SaaS scaling |
| **D-004** | $2,000 (DX) | 0.5 Sprint | **Medium** - Cleaner codebase |

*Assumptions: 10 devs, $100/hr, 5% velocity loss per item.*

---

## 3. Prioritized Roadmap

### Quarter 2: Stabilize & Decouple (Quick Wins)
- [x] **Task Q2-1:** Consolidate `ComicCard` into a single, style-variant component. (COMPLETE)
- [x] **Task Q2-2:** Centralize all mock data into `src/lib/__mocks__`. (COMPLETE)
- [x] **Task Q2-3:** Add Vitest coverage for `useReadingProgress` (Critical path). (COMPLETE)

### Quarter 3: Architectural Refactor
- [ ] **Task Q3-1:** Decompose `DashboardLayout.tsx` into:
  - `DashboardHeader.tsx`
  - `DashboardSidebar.tsx`
  - `SearchFilterBar.tsx`
  - `SearchResultsView.tsx`
- [ ] **Task Q3-2:** Implement Zod-based contract testing for all API routes.

### Quarter 4: Infrastructure Maturity
- [ ] **Task Q4-1:** Integrate Playwright for E2E critical flows (Upload -> Read -> Progress).
- [ ] **Task Q4-2:** Setup Lighthouse CI for performance budget enforcement.

---

## 4. Implementation Guide: Quick Win (Task Q2-1)

**Strategy:** Refactor `DashboardComicCard.tsx` to accept a `variant` prop ('standard' | 'minimal') and retire the old `ComicCard.tsx`.

1. **Step 1:** Add `variant` to `DashboardComicCardProps`.
2. **Step 2:** Port the "Standard" dark theme from `ComicCard.tsx` as a variant.
3. **Step 3:** Update all references in `(app)/library/page.tsx`.
4. **Step 4:** Delete `src/components/molecules/ComicCard/ComicCard.tsx`.

---

## 5. Prevention Plan (Quality Gates)

- **Strict Complexity:** Fail CI if cyclomatic complexity > 15 in any new component.
- **Coverage Mandatory:** Require 80% coverage for any new utility in `src/lib`.
- **Pre-commit:** Enforce `npm run lint` and `npx tsc` on every commit.
