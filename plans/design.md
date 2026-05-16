# Marketing Landing Page Refactor - Technical Design

## 1. Overview

**Project:** Comet Landing Page Animation Refactor  
**Date:** 2026-04-20

This document specifies the technical blueprint for refactoring the landing page with modern animations using Framer Motion.

---

## 2. Animation Variants

### 2.1 Reuse Existing Variants

```typescript
// Existing variants (keep as-is)
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

### 2.2 New Animation Variants

```typescript
// Hero text reveal (word-by-word)
const heroTextVariant = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
};

// Feature card entrance
const featureCardVariant = {
  initial: { opacity: 0, y: 60, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

// Navigation slide-down
const navVariant = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

// Button micro-interaction
const buttonTapVariant = {
  tap: { scale: 0.97 },
  hover: { scale: 1.03 }
};

// Footer fade
const footerVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6 }
};

// Background blob animation
const blobVariant = {
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 5, 0],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
```

---

## 3. Component Architecture

### 3.1 Navigation (`<nav>`)

**Current State:**
- Simple flex layout with logo + links
- Mobile hamburger menu with conditional rendering

**Enhanced State:**
```tsx
<motion.nav
  initial="initial"
  animate="animate"
  variants={navVariant}
  className="relative z-10 flex items-center justify-between px-6 py-8 md:px-12 lg:px-24"
>
  {/* Logo with hover glow */}
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className="flex items-center gap-3"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-comet-accent shadow-[0_0_20px_rgba(124,106,247,0.4)]">
      <Rocket className="text-white" size={20} />
    </div>
    <span className="text-xl font-bold tracking-tight">Comet</span>
  </motion.div>
  
  {/* Desktop links with hover underline animation */}
  <motion.div variants={staggerContainer} className="hidden sm:flex items-center gap-5">
    <motion.div whileHover={{ scale: 1.05 }}>
      <Link href="/login" className="relative text-sm font-semibold text-white hover:text-comet-accent transition-colors">
        {/* Animated underline */}
        <motion.span 
          className="absolute -bottom-1 left-0 h-0.5 w-0 bg-comet-accent"
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.3 }}
        />
        Log in
      </Link>
    </motion.div>
  </motion.div>
</motion.nav>
```

**Mobile Menu Animation:**
```tsx
<AnimatePresence>
  {mobileMenuOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-12 w-48 bg-comet-surface/95 backdrop-blur-xl border border-comet-border rounded-2xl p-4 shadow-xl z-50"
    >
      {/* ...menu items */}
    </motion.div>
  )}
</AnimatePresence>
```

---

### 3.2 Hero Section (`<main>`)

**Current State:**
- Centered text with gradient headline
- Two CTAs (Get Started / Learn More)
- Basic fade-in animation

**Enhanced State:**
```tsx
<motion.main
  className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center md:px-12 lg:px-24"
>
  {/* Animated background blobs */}
  <motion.div 
    variants={blobVariant}
    className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"
  />
  <motion.div 
    variants={{ ...blobVariant, animate: { scale: [1, 1.15, 1], rotate: [0, -5, 0] } }}
    className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none"
  />
  
  {/* Hero content with staggered entrance */}
  <motion.div
    initial="initial"
    animate="animate"
    variants={staggerContainer}
    className="max-w-4xl"
  >
    {/* Badge with bounce-in */}
    <motion.div
      variants={{
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 }
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-comet-accent/30 bg-comet-accent/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-comet-accent uppercase"
    >
      <Zap size={14} />
      The Speed of Light Comic Reader
    </motion.div>
    
    {/* Main headline with word-by-word reveal */}
    <motion.h1 variants={heroTextVariant} className="mb-8 text-5xl font-black leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
      Read Comics at the <br /> 
      <span className="bg-gradient-to-r from-comet-accent via-blue-400 to-comet-accent bg-clip-text text-transparent">
        Speed of Light
      </span>
    </motion.h1>
    
    {/* Subtitle fade */}
    <motion.p variants={fadeIn} className="mb-12 mx-auto max-w-2xl text-lg text-comet-muted md:text-xl">
      Zero lag construction. Offline-first architecture. 
      Experience your collection in a high-res, immersive environment built for 60fps performance.
    </motion.p>
    
    {/* CTA buttons with micro-interactions */}
    <motion.div variants={fadeIn} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/register"
          className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-comet-accent px-10 text-lg font-bold text-white shadow-[0_10px_40px_rgba(124,106,247,0.3)] transition-all sm:w-auto"
        >
          Get Started
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
        <a
          href="#features"
          className="flex h-14 w-full items-center justify-center rounded-2xl border border-comet-border bg-comet-surface/50 px-10 text-lg font-semibold backdrop-blur-md transition-all sm:w-auto"
        >
          Learn More
        </a>
      </motion.div>
    </motion.div>
  </motion.div>
</motion.main>
```

---

### 3.3 Features Grid

**Current State:**
- 3-column grid with `whileInView` animation
- Simple hover effects on cards

**Enhanced State:**
```tsx
<motion.div 
  id="features"
  initial="initial"
  whileInView="animate"
  viewport={{ once: true, margin: "-100px" }}
  variants={{
    animate: { transition: { staggerChildren: 0.15 } }
  }}
  className="mt-40 grid w-full gap-8 md:grid-cols-3"
>
  <FeatureCard 
    icon={<Zap />}
    title="60 FPS Performance"
    description="Decompression and rendering handled by Web Workers to keep the main thread fluid at all times."
    delay={0}
  />
  <FeatureCard 
    icon={<CloudOff />}
    title="Offline First"
    description="Full PWA support means your library is accessible even when you're deep in space (or a subway tunnel)."
    delay={0.1}
  />
  <FeatureCard 
    icon={<Shield />}
    title="Local & Private"
    description="Your comics stay on your device. Metadata enrichment happens client-side. No cloud uploads needed."
    delay={0.2}
  />
</motion.div>
```

**Enhanced FeatureCard Component:**
```tsx
function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div 
      variants={{
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 }
      }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ 
        y: -8, 
        borderColor: 'rgba(124, 106, 247, 0.5)',
        backgroundColor: 'rgba(30, 30, 40, 0.5)'
      }}
      className="group relative flex flex-col items-start rounded-3xl border border-comet-border bg-comet-surface/30 p-8 text-left backdrop-blur-lg transition-all cursor-pointer"
    >
      {/* Animated icon container */}
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-comet-accent/10 text-comet-accent"
      >
        {icon}
      </motion.div>
      
      <h3 className="mb-3 text-xl font-bold">{title}</h3>
      <p className="text-comet-muted leading-relaxed">{description}</p>
      
      {/* Hover arrow indicator */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute right-6 top-6 text-comet-accent"
      >
        <ArrowRight size={20} />
      </motion.div>
    </motion.div>
  );
}
```

---

### 3.4 Footer

```tsx
<motion.footer
  initial="initial"
  whileInView="animate"
  viewport={{ once: true }}
  variants={{
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  }}
  transition={{ duration: 0.6, delay: 0.2 }}
  className="relative z-10 border-t border-comet-border bg-comet-surface/20 py-12 text-center text-sm text-comet-muted"
>
  <p>© 2026 Comet — The Speed of Light Comic Reader. All rights reserved.</p>
</motion.footer>
```

---

## 4. Motion Preferences

### 4.1 Reduced Motion Handling

```tsx
// Add at the top of page component
import { useReducedMotion } from 'framer-motion';

export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  
  // Use reduced motion variants when preferred
  const animatedFadeIn = shouldReduceMotion 
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : fadeIn;
  
  // ...
}
```

### 4.2 CSS Fallback (for non-JS)

```css
/* In globals.css or inline style */
@media (prefers-reduced-motion: reduce) {
  .motion-friendly {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 5. Performance Optimizations

### 5.1 GPU-Accelerated Properties Only

| Use ✅ | Avoid ❌ |
|--------|----------|
| `transform` | `width`, `height` |
| `opacity` | `top`, `left`, `right`, `bottom` |
| `rotate` | `margin`, `padding` |
| `scale` | `font-size` |

### 5.2 Animation Duration Guidelines

| Animation Type | Duration |
|----------------|----------|
| Micro-interactions (hover/tap) | 100-200ms |
| Element transitions | 200-400ms |
| Page entrance animations | 400-800ms |
| Scroll-triggered reveals | 500-600ms |
| Background ambient motion | 15-30s (infinite) |

### 5.3 Lazy Loading

```tsx
// Dynamic import for heavy animation components
import dynamic from 'next/dynamic';

const AnimatedFeatureGrid = dynamic(
  () => import('./AnimatedFeatureGrid'),
  { ssr: false, loading: () => <div className="h-96" /> }
);
```

---

## 6. File Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `src/app/page.tsx` | Refactor with enhanced animations | Main landing page |
| `src/app/globals.css` | Add reduced-motion CSS | Global (optional) |

---

## 7. Testing Checklist

- [ ] Page loads without FOUC (flash of unstyled content)
- [ ] All animations render at 60fps
- [ ] `prefers-reduced-motion: reduce` disables animations
- [ ] Mobile menu animation is smooth
- [ ] No layout shift during animations
- [ ] Lighthouse performance ≥ 90
- [ ] No console errors

---

## 8. Implementation Notes

1. **Preserve existing functionality** - Login/Register/Library links must work
2. **Maintain brand colors** - Use existing `comet-*` CSS variables
3. **Framer Motion already installed** - No new dependencies needed
4. **Mobile-first** - Design for mobile, enhance for desktop
5. **Test on device** - Animations that look smooth in dev may stutter on mobile
