# Marketing Landing Page Refactor - Requirements

## 1. Overview

**Project:** Comet Landing Page Animation Refactor  
**Type:** UI Enhancement  
**Priority:** P1  
**Date:** 2026-04-20

Refactor the marketing landing page (`src/app/page.tsx`) with modern, sleek animations while maintaining visual consistency with the existing brand identity.

## 2. Scope

### 2.1 Animation Requirements

**Scroll-Triggered Animations:**
- Elements animate when entering viewport (using `whileInView`)
- Animation triggers only once per element (`once: true`)
- Staggered animations for lists and grids
- Parallax effect on background elements

**Entrance Effects:**
- Hero section: staggered fade-in from bottom
- Features grid: cards animate in sequence
- Navigation: slide-down on mount
- Footer: fade-in on scroll

**Micro-Interactions:**
- Buttons: scale + shadow on hover, press effect on click
- Logo: subtle hover glow effect
- Navigation links: underline animation
- Feature cards: lift + border glow on hover
- Mobile menu: smooth slide-in with backdrop blur

**Page State Transitions:**
- Smooth scroll to sections via anchor links
- Loading state for buttons during navigation
- Fade transitions between page states

### 2.2 Performance Requirements

**Fast Load Times:**
- Critical CSS inlined
- Animations use `transform` and `opacity` only (GPU-accelerated)
- No layout-triggering properties in animations
- Use `will-change` sparingly for complex animations
- Lazy-load below-fold content

**Responsive Layout:**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Animations scale appropriately for mobile (reduced motion preferred)
- Touch-friendly interactions on mobile

### 2.3 Design Consistency

**Maintain Existing Brand:**
- Use existing CSS variables: `comet-bg`, `comet-surface`, `comet-accent`, `comet-muted`
- Gradient backgrounds: `from-violet-900/20 via-comet-bg/80 to-indigo-900/30`
- Typography: existing font classes
- Icon library: `lucide-react`
- Border radius: `rounded-2xl`, `rounded-3xl`

**Color Palette (from existing code):**
| Token | Hex | Usage |
|-------|-----|-------|
| `comet-accent` | `#7c6af7` (violet-500) | Primary CTA |
| `comet-accent-hover` | darker violet | Hover states |
| `comet-bg` | dark background | Page background |
| `comet-surface` | lighter surface | Cards, elevated elements |
| `comet-border` | border color | Dividers, borders |
| `comet-text` | white/near-white | Primary text |
| `comet-muted` | muted gray | Secondary text |

## 3. User Stories

### Animation UX
- As a user, I want smooth animations so the page feels premium and polished
- As a user, I want scroll-triggered animations so content appears dynamically as I browse
- As a user on mobile, I want reduced motion options so the page doesn't feel overwhelming

### Performance
- As a user, I want fast page load so I don't wait for animations to load
- As a user on slow connections, I want graceful degradation so content is accessible without JS

### Interactions
- As a user, I want micro-interactions on buttons so I know they're clickable
- As a user, I want hover feedback on cards so I know they're interactive
- As a user, I want smooth scrolling so navigation feels fluid

## 4. Technical Constraints

### Animation Library
- **Framer Motion** is already installed and used in the project
- Use Framer Motion for all animations (no GSAP addition needed)
- Prefer Framer Motion's `motion` components over CSS animations for complex interactions

### Existing Code to Preserve
- `fadeIn` variant structure
- `staggerContainer` variant structure
- Session-aware navigation (show Login/Register vs Library)
- Mobile hamburger menu functionality
- Gradient background effects

### Browser Support
- Modern browsers (last 2 versions)
- Respect `prefers-reduced-motion` media query
- Graceful degradation for older browsers

## 5. Accessibility

### Motion Accessibility
- All scroll-triggered animations respect `prefers-reduced-motion`
- When reduced motion is preferred: instant visibility, no transforms
- Fallback static states for users who prefer no animation

### Keyboard Navigation
- All interactive elements keyboard accessible
- Focus visible states maintained during animations
- No keyboard traps introduced by animations

### Screen Reader
- Animations are `aria-hidden="true"` (decorative)
- Content readable without animation support

## 6. Out of Scope

- Changes to app routing or navigation structure
- Backend API changes
- Changes to auth flow
- New feature development beyond animations

## 7. Dependencies

- `framer-motion` (already installed)
- `lucide-react` (already installed)
- `next/link` (already used)
- `next-auth/react` (already used)

## 8. Success Criteria

1. Page loads under 2s on 3G connection (simulation)
2. All animations use `transform` and `opacity` (no layout thrashing)
3. `prefers-reduced-motion` users see instant visibility, no movement
4. Lighthouse performance score ≥ 90
5. Lighthouse accessibility score ≥ 95
6. All existing functionality preserved (login/register/library links work)
7. Mobile menu animations smooth at 60fps
8. No console errors or warnings related to animation
