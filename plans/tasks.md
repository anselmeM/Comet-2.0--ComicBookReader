# Marketing Landing Page Refactor - Implementation Tasks

**Date:** 2026-04-20  
**Project:** Comet Landing Page Animation Refactor  
**Status:** Ready for Implementation

---

## Prerequisites

- [ ] Verify `framer-motion` is installed: `npm list framer-motion`
- [ ] Verify `lucide-react` is installed: `npm list lucide-react`
- [ ] Run existing page to verify baseline functionality

---

## Task 1: Set Up Animation Variants

**Task 1.1: Define animation variants in `src/app/page.tsx`**
- [ ] Keep existing `fadeIn` variant
- [ ] Keep existing `staggerContainer` variant
- [ ] Add `heroTextVariant` for main headline
- [ ] Add `featureCardVariant` for feature cards
- [ ] Add `navVariant` for navigation slide-down
- [ ] Add `buttonTapVariant` for button press effect
- [ ] Add `footerVariant` for footer fade
- [ ] Add `blobVariant` for animated background blobs

---

## Task 2: Implement Navigation Animations

**Task 2.1: Animate nav container**
- [ ] Wrap `<nav>` with `<motion.nav variants={navVariant}>`
- [ ] Verify initial="initial" animate="animate"

**Task 2.2: Add logo hover effect**
- [ ] Wrap logo `<div>` with `<motion.div whileHover={{ scale: 1.05 }}>`

**Task 2.3: Animate navigation links**
- [ ] Add animated underline using `<motion.span>` with `whileHover`
- [ ] Verify hover width animation works

**Task 2.4: Animate mobile hamburger menu**
- [ ] Use `<AnimatePresence>` for mobile menu
- [ ] Add `initial`, `animate`, `exit` variants for mobile menu panel
- [ ] Test on mobile viewport

---

## Task 3: Implement Hero Section Animations

**Task 3.1: Add animated background blobs**
- [ ] Wrap existing background blobs with `<motion.div variants={blobVariant}>`
- [ ] Add second blob with slightly different animation timing
- [ ] Verify blobs animate continuously without performance impact

**Task 3.2: Enhance hero badge**
- [ ] Add spring animation with bounce effect
- [ ] Verify scale animation from 0.8 to 1

**Task 3.3: Enhance main headline**
- [ ] Apply `heroTextVariant` to `<h1>`
- [ ] Verify word reveal timing

**Task 3.4: Enhance CTA buttons**
- [ ] Wrap each CTA with `<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>`
- [ ] Test hover scale effect
- [ ] Test tap/press effect

---

## Task 4: Implement Features Grid Animations

**Task 4.1: Update features container animation**
- [ ] Add `viewport={{ once: true, margin: "-100px" }}` for scroll trigger
- [ ] Update stagger timing to 0.15s between cards
- [ ] Verify cards animate when scrolled into view

**Task 4.2: Enhance FeatureCard component**
- [ ] Add `whileHover` for card lift effect
- [ ] Add animated border color on hover
- [ ] Add icon scale and rotate on hover
- [ ] Add animated arrow indicator on hover
- [ ] Add `delay` prop for staggered entrance

**Task 4.3: Test scroll-triggered animations**
- [ ] Scroll down to features section
- [ ] Verify animations trigger once only
- [ ] Verify margin works for early trigger

---

## Task 5: Add Reduced Motion Support

**Task 5.1: Implement `useReducedMotion` hook**
- [ ] Import `useReducedMotion` from `framer-motion`
- [ ] Add reduced motion check at component top
- [ ] Create conditional variants that skip animation

**Task 5.2: Add CSS fallback for reduced motion**
- [ ] Consider adding `prefers-reduced-motion` media query in globals.css
- [ ] Test with "reduce motion" system preference enabled

---

## Task 6: Performance Optimization

**Task 6.1: Verify GPU-accelerated properties**
- [ ] Confirm all animations use `transform` and `opacity` only
- [ ] No layout properties in animation (width, height, margin, padding)

**Task 6.2: Test animation performance**
- [ ] Open Chrome DevTools → Performance tab
- [ ] Record scrolling on landing page
- [ ] Verify no dropped frames (60fps target)

**Task 6.3: Verify no layout shift**
- [ ] Check for CLS (Cumulative Layout Shift) in Lighthouse
- [ ] Ensure animations don't shift content below them

---

## Task 7: Responsive Testing

**Task 7.1: Test on mobile viewport**
- [ ] Resize to 375px width
- [ ] Verify hamburger menu animation works
- [ ] Verify CTAs stack vertically

**Task 7.2: Test on tablet viewport**
- [ ] Resize to 768px width
- [ ] Verify navigation links display
- [ ] Verify features grid is 3 columns

**Task 7.3: Test on desktop viewport**
- [ ] Resize to 1280px width
- [ ] Verify full layout renders
- [ ] Verify all hover effects work

---

## Task 8: Accessibility Verification

**Task 8.1: Test keyboard navigation**
- [ ] Tab through all interactive elements
- [ ] Verify focus states visible during animation
- [ ] Verify Enter/Space activates buttons

**Task 8.2: Test with screen reader**
- [ ] Verify content readable without animation
- [ ] Verify `aria-hidden="true"` on decorative animated elements

**Task 8.3: Test reduced motion accessibility**
- [ ] Enable "reduce motion" in OS settings
- [ ] Verify page doesn't cause motion sickness triggers
- [ ] Verify content still accessible

---

## Task 9: Lighthouse Audit

- [ ] Run Lighthouse performance audit
- [ ] Verify performance score ≥ 90
- [ ] Verify accessibility score ≥ 95
- [ ] Fix any issues found

---

## Task 10: Final Verification

**Task 10.1: Functional testing**
- [ ] Login link navigates to `/login`
- [ ] Register link navigates to `/register`
- [ ] "Go to Library" link works for logged-in users
- [ ] "Learn More" scrolls to `#features`

**Task 10.2: Visual regression**
- [ ] Compare with previous version for visual consistency
- [ ] Verify brand colors unchanged
- [ ] Verify typography consistent

**Task 10.3: Cross-browser testing**
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)

---

## File Changes Summary

| File | Change Type | Lines |
|------|-------------|-------|
| `src/app/page.tsx` | Modify | Full refactor |
| `src/app/globals.css` | Modify (optional) | Add reduced-motion CSS |

---

## Execution Order

1. **Task 1** - Set up animation variants (foundation)
2. **Task 2** - Navigation animations
3. **Task 3** - Hero section animations
4. **Task 4** - Features grid animations
5. **Task 5** - Reduced motion support
6. **Task 6** - Performance optimization
7. **Task 7** - Responsive testing
8. **Task 8** - Accessibility verification
9. **Task 9** - Lighthouse audit
10. **Task 10** - Final verification

---

## Dependencies

- Framer Motion (already installed)
- Lucide React (already installed)
- Next.js (already in project)
