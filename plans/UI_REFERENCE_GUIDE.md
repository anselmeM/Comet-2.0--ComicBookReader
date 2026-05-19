# Comet 2.0 UI Reference Guide

> **Single Source of Truth** for maintaining UI consistency across the ComicBookReader application.
> This guide enables automated or manual verification that all components adhere to the new "Comic-Modern" (Midnight Nebula) patterns.

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Component Library](#2-component-library)
3. [Usage Compliance Checklist](#3-usage-compliance-checklist)

---

## 1. Design Tokens

### 1.1 Color Palette

| Token Name | Hex Code | Tailwind Class | Usage |
|------------|----------|----------------|-------|
| **Primary** | `#3b82f6` | `blue-500` | CTAs, active states, links |
| **Primary Hover** | `#2563eb` | `blue-600` | Button hover states |
| **Primary Light** | `#60a5fa` | `blue-400` | Progress indicators |
| **Secondary Dark** | `#0f172a` | `slate-900` | Widget backgrounds |
| **Midnight Surface** | `#0a0a0f` | `bg-[#0a0a0f]` | Dark theme backgrounds |
| **Surface** | `#ffffff` | `white` | Cards, elevated surfaces |
| **Background Alt** | `#fafcff` | `bg-[#FAFBFF]` | Main content area |
| **Text Primary** | `#0f172a` | `text-neutral-900` | Headings, primary text |
| **Text Secondary** | `#64748b` | `text-neutral-500` | Labels, secondary text |
| **Text Muted** | `#94a3b8` | `text-neutral-400` | Placeholders, hints |
| **Destructive** | `#ef4444` | `red-500` | Delete actions, badges |
| **Success** | `#22c55e` | `green-500` | Success states |

#### Background Gradient (Light Mode)
```css
bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100
```

#### Sidebar Border
```css
border-r border-neutral-50
```

---

### 1.2 Typography Scale (Comic-Modern)

| Element | Font Family | Size | Weight | Line Height | Tailwind Class |
|---------|-------------|------|--------|-------------|----------------|
| Logo | System Sans | 1.875rem (30px) | 900 (black) | tight | `text-3xl font-black tracking-tighter italic` |
| Section Heading | System Sans | 2.25rem (36px) | 900 (black) | tight | `text-4xl font-black tracking-tighter italic` |
| Card Title | System Sans | 0.875rem (14px) | 700 (bold) | tight | `text-sm font-bold` |
| Body Text | System Sans | 0.875rem (14px) | 500 (medium) | normal | `text-sm font-medium` |
| Label | System Sans | 0.75rem (12px) | 900 (black) | none | `text-xs font-black uppercase tracking-widest` |
| Caption | System Sans | 0.625rem (10px) | 900 (black) | none | `text-[10px] font-black uppercase tracking-widest` |

#### Font Stack
```css
font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

---

### 1.3 Spacing System

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `xs` | 4px | `space-x-1` / `p-1` | Icon padding |
| `sm` | 8px | `space-y-2` / `p-2` | Tight spacing |
| `md` | 16px | `gap-4` / `p-4` | Default spacing |
| `lg` | 24px | `gap-6` / `p-6` | Section gaps |
| `xl` | 32px | `gap-8` / `p-8` | Large gaps |
| `2xl` | 48px | `gap-12` / `p-12` | Container padding |

#### Sidebar Padding
```css
py-14 px-8  /* vertical: 56px, horizontal: 32px */
```

#### Main Content Padding
```css
p-12  /* 48px all sides */
```

---

### 1.4 Border Radius (Aggressive Curves)

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `md` | 8px | `rounded-lg` | Small Buttons |
| `lg` | 12px | `rounded-xl` | Inputs, Sub-cards |
| `xl` | 16px | `rounded-2xl` | Comic Cards, Small Widgets |
| `2xl` | 24px | `rounded-3xl` | Standard Widgets |
| `3xl` | 40px | `rounded-[2.5rem]` | Major Containers, Hero Cards |
| `full` | 9999px | `rounded-full` | Avatars, Pill buttons |

---

## 2. Component Library

### 2.1 Navigation Sidebar

**Structure:** Vertical flex container expanding to `320px` or collapsing to `120px`.
**Active State:** `bg-blue-500 text-white shadow-xl shadow-blue-500/40 translate-x-1`.
**Inactive State:** `text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900`.
**Icons:** `size={24} strokeWidth={2.5}`.
**Radius:** `rounded-[1.8rem]`.

### 2.2 Header / Search

**Search Bar:** `<motion.div className="bg-[#0F172A] rounded-2xl max-w-2xl">` with transparent input field.
**Focus State:** `focus:ring-2 focus:ring-blue-500/20` (or opacity expansion via framer-motion).
**User Profile:** Avatar is `44x44px rounded-full object-cover`. Name uses `text-sm font-black tracking-tighter text-neutral-900`.

### 2.3 Featured Hero Card

**Structure:** `lg:col-span-8 relative h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl`.
**Gradient Overlay:** `bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent`.
**Typography:** 
- Title: `text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter`.
- Author: `text-xs font-black uppercase tracking-[0.3em] text-blue-400`.
**CTA Button:** `bg-blue-500 hover:bg-blue-600 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30`.
**Animation:** Image scales to `105%` on hover over 1000ms (`duration-1000`).

### 2.4 Continue Reading Widget

**Structure:** `lg:col-span-4 bg-[#0F172A] rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl`.
**Background Element:** Absolute positioned subtle icon (e.g., `BookOpen` with 10% opacity).
**Typography:** `text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`.

### 2.5 Favourite Heroes

**Avatars:** `w-24 h-24` (96x96px) with `rounded-full`.
**Blend Mode:** `mix-blend-multiply opacity-90`.
**Hover Effect:** `-translate-y-2 shadow-xl`.

### 2.6 Comics Grid

**Layout:** `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-8`.
**Cards:** `aspect-[2/3] rounded-2xl shadow-lg border border-neutral-100 group-hover:shadow-2xl`.
**Title:** `text-sm font-black text-blue-600 line-clamp-1 group-hover:underline`.
**Author:** `text-[11px] font-bold text-slate-500 uppercase tracking-wider`.

---

## 3. Usage Compliance Checklist

- [x] All typography uses extreme tracking for modern feel (`tracking-tighter` for headers, `tracking-widest` for uppercase labels).
- [x] All primary headers use `font-black italic`.
- [x] Main app containers use `rounded-[2.5rem]`.
- [x] Hover states incorporate generous shadows (e.g., `shadow-blue-500/30`).
- [x] Secondary labels are exclusively uppercase (`text-[10px] uppercase`).

*Document Version: 2.0*
*Last Updated: 2026-05-11*
*Maintainer: Comet 2.0 Design System*