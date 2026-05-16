# Landing Page Redesign: Comet 2.0

## 1. Objective
Transform the current landing page into a high-impact, "Comic-Modern" experience that captures the energy of comic storytelling while maintaining professional software standards.

## 2. Visual Identity (The "Midnight Nebula" Theme)
- **Backgrounds**: Deep Charcoal (`#09090B`) with animated mesh gradients (Purple/Blue).
- **Typography**: 
    - Headings: `font-black tracking-tighter italic` (Impactful, energetic).
    - Body: `font-medium text-neutral-400` (Readable, professional).
- **Accents**: 
    - Electric Indigo (`#6366f1`) for primary actions.
    - Cyber Cyan (`#22d3ee`) for secondary highlights.
    - Glassmorphism: `backdrop-blur-xl bg-white/5 border-white/10`.

## 3. Key Sections & Components

### 3.1 Hero: "The Speed of Light"
- **Visual**: A large, centered headline with a gradient text effect.
- **Micro-interaction**: Floating "Comic Panels" (UI mockups) that respond to mouse movement (parallax).
- **CTA**: High-contrast "Start Reading" button with a pulse glow.

### 3.2 Features: "The Panel Grid"
- **Layout**: 3-column grid of cards.
- **Style**: Each card has a thick `border-2 border-neutral-800` that turns indigo on hover.
- **Animation**: Staggered entrance from the bottom.
- **Content**: Library Management, Offline Sync, and Performance (60FPS).

### 3.3 Guided View: "Into the Panels"
- **Visual**: A split-screen section. 
    - Left: Description of Guided View tech.
    - Right: A mockup showing a comic page being "sliced" into panels (using CSS borders/animations).

### 3.4 Social: "Your Reading Circle"
- **Visual**: Avatar stacks and a "Recent Activity" ticker.
- **Focus**: Emphasize friends, sharing, and community.

### 3.5 Footer: "Join the Orbit"
- **Visual**: Clean, dark footer with essential links and a final CTA.

## 4. Technical Implementation
- **Framework**: Next.js App Router.
- **Styling**: Tailwind CSS v4 (using the new utility features).
- **Motion**: 
    - `AnimatePresence` for page transitions.
    - `useScroll` and `useTransform` for parallax effects.
    - `whileInView` for scroll-triggered reveals.
- **Icons**: `lucide-react`.

## 5. Verification Plan
- **Performance**: Ensure no layout shifts (CLS < 0.1).
- **Accessibility**: Contrast check (WCAG AA), aria-labels for buttons, reduced-motion support.
- **Responsive**: Test at 390px (Mobile), 768px (Tablet), and 1440px (Desktop).
