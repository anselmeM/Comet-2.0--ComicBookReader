# Comet 2.0 UI Reference Guide

> **Single Source of Truth** for maintaining UI consistency across the ComicBookReader application.
> This guide enables automated or manual verification that all components adhere to documented patterns.

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
| **Surface** | `#ffffff` | `white` | Cards, elevated surfaces |
| **Background** | `#f8fafc` | `slate-50` | Page backgrounds |
| **Background Alt** | `#fafcff` | (custom) | Main content area |
| **Text Primary** | `#0f172a` | `slate-900` | Headings, primary text |
| **Text Secondary** | `#64748b` | `slate-500` | Labels, secondary text |
| **Text Muted** | `#94a3b8` | `slate-400` | Placeholders, hints |
| **Destructive** | `#ef4444` | `red-500` | Delete actions, badges |
| **Success** | `#22c55e` | `green-500` | Success states |
| **Warning** | `#f59e0b` | `amber-500` | Warning states |

#### Background Gradient
```css
bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100
```
- Start: `blue-100` (#dbeafe)
- Middle: `indigo-50` (#eef2ff)
- End: `pink-100` (#fce7f3)

#### Sidebar Border
```css
border-r border-slate-100
```
- Color: `slate-100` (#f1f5f9)

---

### 1.2 Typography Scale

| Element | Font Family | Size | Weight | Line Height | Tailwind Class |
|---------|-------------|------|--------|-------------|----------------|
| Logo | System Sans | 1.875rem (30px) | 800 (extrabold) | tight | `text-3xl font-extrabold tracking-tight` |
| Section Heading | System Sans | 1.5rem (24px) | 700 (bold) | tight | `text-2xl font-bold` |
| Card Title | System Sans | 1rem (16px) | 600 (semibold) | none | `text-base font-semibold` |
| Body Text | System Sans | 0.875rem (14px) | 500 (medium) | none | `text-sm font-medium` |
| Label | System Sans | 0.75rem (12px) | 600 (semibold) | none | `text-xs font-semibold` |
| Caption | System Sans | 0.75rem (12px) | 500 (medium) | none | `text-xs font-medium` |

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
py-10 px-8  /* vertical: 40px, horizontal: 32px */
```

#### Main Content Padding
```css
p-10  /* 40px all sides */
```

#### Card Internal Padding
```css
p-4 to p-6  /* 16px to 24px */
```

---

### 1.4 Border Radius

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `none` | 0px | `rounded-none` | Edge cases |
| `sm` | 4px | `rounded-sm` | Small elements |
| `md` | 8px | `rounded-lg` | Buttons, inputs |
| `lg` | 12px | `rounded-xl` | Cards |
| `xl` | 16px | `rounded-2xl` | Nav items, widgets |
| `2xl` | 24px | `rounded-3xl` | Major containers |
| `3xl` | 32px | `rounded-[2rem]` | Hero cards |
| `full` | 9999px | `rounded-full` | Avatars, pills |

#### Container Radius
```css
rounded-[2.5rem]  /* 40px */
```

#### Sidebar Nav Items
```css
rounded-2xl  /* 16px */
```

#### Comic Cards
```css
rounded-2xl  /* 16px */
```

---

## 2. Component Library

### 2.1 Navigation Sidebar

**Location:** [`src/components/organisms/Dashboard/DashboardLayout.tsx`](src/components/organisms/Dashboard/DashboardLayout.tsx:95)

#### Structure

```tsx
<aside className="w-[280px] flex flex-col justify-between py-10 px-8 border-r border-slate-100 shrink-0 bg-white">
  {/* Logo */}
  <h1 className="text-3xl font-extrabold mb-12 tracking-tight">Geek</h1>
  
  {/* Nav Items */}
  <nav className="space-y-2">
    {navItems.map((item) => (
      <NavButton key={item.id} item={item} isActive={activeNav === item.id} />
    ))}
  </nav>
  
  {/* Bottom Items */}
  <div className="space-y-2">
    {bottomNavItems.map((item) => (
      <NavButton key={item.id} item={item} />
    ))}
  </div>
</aside>
```

#### NavButton Component

```tsx
interface NavItem {
  name: string;
  icon: React.ElementType;
  id: string;
}

interface NavButtonProps {
  item: NavItem;
  isActive?: boolean;
}

function NavButton({ item, isActive = false }: NavButtonProps) {
  return (
    <button
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold transition-all duration-200 ${
        isActive 
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 translate-x-1' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <item.icon 
        size={20} 
        className={isActive ? 'text-white' : 'text-slate-400'} 
        strokeWidth={isActive ? 2.5 : 2} 
      />
      {item.name}
    </button>
  );
}
```

#### States

| State | Background | Text Color | Icon Color | Shadow | Transform |
|-------|------------|------------|------------|--------|-----------|
| **Default** | transparent | `slate-500` | `slate-400` | none | none |
| **Hover** | `slate-50` | `slate-900` | `slate-400` | none | none |
| **Active** | `blue-500` | `white` | `white` | `shadow-lg shadow-blue-500/30` | `translate-x-1` |

#### Accessibility

- `aria-current="page"` on active nav item
- `aria-label` not required when text label is visible
- Focus visible ring on keyboard navigation (ensure `focus-visible:ring-2`)

#### Animation Specifications

| Property | Duration | Easing | Trigger |
|----------|----------|--------|---------|
| Background | 200ms | ease-out | hover |
| Color | 200ms | ease-out | hover |
| Transform | 200ms | ease-out | active |
| Shadow | 300ms | ease-out | active |

---

### 2.2 Search Bar

**Location:** [`src/components/organisms/Dashboard/DashboardLayout.tsx`](src/components/organisms/Dashboard/DashboardLayout.tsx:548)

#### Structure

```tsx
<div className="relative w-full max-w-[500px]">
  <Search 
    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" 
    size={20} 
  />
  <input 
    type="text" 
    placeholder="Search" 
    className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-3 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
    aria-label="Search comics"
  />
</div>
```

#### States

| State | Border | Ring | Shadow | Icon Color |
|-------|--------|------|--------|------------|
| **Default** | `border-slate-200` | none | `shadow-sm` | `slate-400` |
| **Focus** | `border-transparent` | `ring-2 ring-blue-500` | `shadow-sm` | `slate-400` |
| **Filled** | `border-slate-200` | none | `shadow-sm` | `slate-400` |
| **Error** | `border-red-500` | `ring-2 ring-red-500` | none | `slate-400` |

#### Layout Specs

| Property | Value |
|----------|-------|
| Max Width | `500px` |
| Height | `py-3` (12px top/bottom) |
| Padding Left | `pl-14` (56px for icon) |
| Border Radius | `rounded-2xl` |
| Icon Position | `left-5` (20px from edge) |
| Icon Vertical | `top-1/2 -translate-y-1/2` (centered) |

#### Accessibility

- `aria-label="Search comics"` (or descriptive label)
- `role="searchbox"` implicit with `type="text"`
- Placeholder text must be descriptive, not just "Search"

---

### 2.3 Notification Bell

**Location:** [`src/components/organisms/Dashboard/DashboardLayout.tsx`](src/components/organisms/Dashboard/DashboardLayout.tsx:563)

#### Structure

```tsx
<button 
  className="text-slate-600 hover:text-slate-900 transition-colors relative"
  aria-label="Notifications"
>
  <Bell size={24} strokeWidth={2} />
  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#fafcff] rounded-full" />
</button>
```

#### States

| State | Icon Color | Badge |
|-------|------------|-------|
| **Default** | `slate-600` | Visible (red dot) |
| **Hover** | `slate-900` | Visible |
| **Unread** | `slate-600` | Visible with pulse |
| **Empty** | `slate-600` | Hidden |

#### Badge Specifications

| Property | Value |
|----------|-------|
| Size | `w-2.5 h-2.5` (10px) |
| Color | `bg-red-500` |
| Border | `border-2 border-[#fafcff]` |
| Position | `top-0 right-0` |
| Border Radius | `rounded-full` |

#### Accessibility

- `aria-label="Notifications"` required
- Consider `aria-live="polite"` for unread count changes
- Badge should use `aria-hidden="true"` (decorative)

---

### 2.4 User Profile

**Location:** [`src/components/organisms/Dashboard/DashboardLayout.tsx`](src/components/organisms/Dashboard/DashboardLayout.tsx:566)

#### Structure

```tsx
<div className="flex items-center gap-3 cursor-pointer group">
  <img 
    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" 
    alt="Melissa Doe" 
    className="w-11 h-11 rounded-full object-cover border border-slate-200 group-hover:border-blue-500 transition-colors"
  />
  <span className="font-semibold text-slate-700 group-hover:text-slate-900">Melissa Doe</span>
</div>
```

#### States

| State | Border Color | Text Color |
|-------|--------------|------------|
| **Default** | `slate-200` | `slate-700` |
| **Hover** | `blue-500` | `slate-900` |

#### Avatar Specifications

| Property | Value |
|----------|-------|
| Size | `w-11 h-11` (44x44px) |
| Border Radius | `rounded-full` |
| Object Fit | `object-cover` |
| Border | `border border-slate-200` |

#### Accessibility

- `alt` text should be user's name: `"Melissa Doe"`
- If avatar is purely decorative, use `alt=""`
- Name label should be `<span>` not `<p>` (not a paragraph)

---

### 2.5 Featured Hero Card

**Location:** [`src/components/organisms/Dashboard/DashboardLayout.tsx`](src/components/organisms/Dashboard/DashboardLayout.tsx:380)

#### Structure

```tsx
<div className="col-span-12 lg:col-span-8 relative rounded-[2rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
  {/* Background Image */}
  <img 
    src="https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=1200&auto=format&fit=crop" 
    alt="Featured Comic" 
    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
  />
  
  {/* Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
  
  {/* Content */}
  <div className="absolute bottom-0 left-0 p-10 w-full flex justify-between items-end">
    <div className="text-white pr-6">
      <p className="text-slate-300 mb-2 font-medium tracking-wide">Nick Spencer</p>
      <h2 className="text-4xl font-extrabold leading-tight max-w-[450px]">
        the Amazing Spider-Man<br />
        Vol. 1: Back To Basics
      </h2>
    </div>
    <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-full font-bold transition-colors shadow-lg shadow-blue-500/30 shrink-0">
      Read Now
    </button>
  </div>
</div>
```

#### Grid Layout

| Breakpoint | Column Span |
|------------|-------------|
| Mobile (`col-span-12`) | Full width |
| Desktop (`lg:col-span-8`) | 8 of 12 columns |

#### Background Image Specs

| Property | Value |
|----------|-------|
| Position | `absolute inset-0` |
| Size | `w-full h-full` |
| Object Fit | `object-cover` |
| Hover Scale | `scale-105` |
| Transition | `duration-700` |

#### Gradient Overlay

```css
bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent
```

| Stop | Color | Opacity |
|------|-------|---------|
| Bottom (0%) | `slate-900` | 90% |
| Middle (50%) | `slate-900` | 30% |
| Top (100%) | transparent | 0% |

#### States

| State | Shadow | Image Scale |
|-------|--------|-------------|
| **Default** | `shadow-sm` | `scale-100` |
| **Hover** | `shadow-xl` | `scale-105` |

#### CTA Button

```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-full font-bold transition-colors shadow-lg shadow-blue-500/30 shrink-0">
  Read Now
</button>
```

| State | Background | Shadow |
|-------|------------|--------|
| **Default** | `blue-500` | `shadow-lg shadow-blue-500/30` |
| **Hover** | `blue-600` | same |

#### Accessibility

- Image has descriptive `alt="Featured Comic"` (or specific title)
- CTA button text is "Read Now" - descriptive action
- Ensure text contrast ratio meets WCAG AA (white on dark overlay)

---

### 2.6 Continue Reading Widget

**Location:** [`src/components/organisms/Dashboard/DashboardLayout.tsx`](src/components/organisms/Dashboard/DashboardLayout.tsx:406)

#### Structure

```tsx
<div className="flex-1 flex flex-col">
  <h3 className="text-xl font-bold mb-4 text-slate-900">Continue Reading</h3>
  <div className="relative rounded-[2rem] overflow-hidden flex-1 bg-slate-900 cursor-pointer shadow-sm hover:shadow-lg transition-shadow">
    {/* Background Image */}
    <img 
      src="https://images.unsplash.com/photo-1612036782180-6f0b6ce846ce?q=80&w=400&auto=format&fit=crop" 
      alt="Current Comic" 
      className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" 
    />
    {/* Content */}
    <div className="absolute inset-0 p-6 flex items-center justify-between">
      <h4 className="text-white font-bold text-lg max-w-[160px] leading-snug">
        Peter Parker: The Spectacular Spider-Man #309
      </h4>
      <CircularProgress percentage={76} />
    </div>
  </div>
</div>
```

#### CircularProgress Component

```tsx
const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-16 h-16">
        {/* Background Circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="#3b82f6"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{percentage}%</span>
      </div>
    </div>
  );
};
```

#### CircularProgress Props

```tsx
interface CircularProgressProps {
  percentage: number; // 0-100
}
```

#### SVG Specifications

| Property | Value |
|----------|-------|
| Size | `w-16 h-16` (64x64px) |
| Transform | `rotate-90` (start from top) |
| Radius | `r={24}` |
| Circumference | `2 * PI * 24 ≈ 150.8` |
| Stroke Width | `6` |
| Background Color | `rgba(255,255,255,0.1)` |
| Progress Color | `blue-500` (#3b82f6) |
| Stroke Linecap | `round` |

#### Animation

| Property | Duration | Easing |
|----------|----------|--------|
| Progress Circle | `1000ms` | `ease-out` |

---

### 2.7 Favourite Heroes Grid

**Location:** [`src/components/organisms/Dashboard/DashboardLayout.tsx`](src/components/organisms/Dashboard/DashboardLayout.tsx:433)

#### Structure

```tsx
<div>
  <h3 className="text-xl font-bold mb-4 text-slate-900">Your Favourite Heroes</h3>
  <div className="flex gap-4">
    {favouriteHeroes.map((hero, idx) => (
      <div 
        key={idx} 
        className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${hero.bgColor}`}
      >
        <img 
          src={hero.imageUrl} 
          alt={hero.name} 
          className="w-full h-full object-cover mix-blend-multiply opacity-90" 
        />
      </div>
    ))}
  </div>
</div>
```

#### Hero Data Structure

```tsx
interface Hero {
  name: string;
  imageUrl: string;
  bgColor: string;
}

const favouriteHeroes: Hero[] = [
  { name: 'Spider-Man', imageUrl: '...', bgColor: 'bg-red-500' },
  { name: 'Hulk', imageUrl: '...', bgColor: 'bg-green-500' },
  { name: 'Black Widow', imageUrl: '...', bgColor: 'bg-purple-600' },
  { name: 'Iron Man', imageUrl: '...', bgColor: 'bg-yellow-400' },
];
```

#### Avatar Specifications

| Property | Value |
|----------|-------|
| Size | `w-[72px] h-[72px]` (72x72px) |
| Border Radius | `rounded-full` |
| Background Colors | `red-500`, `green-500`, `purple-600`, `yellow-400` |
| Image Blend | `mix-blend-multiply` |
| Image Opacity | `opacity-90` |

#### States

| State | Shadow | Transform |
|-------|--------|-----------|
| **Default** | `shadow-sm` | none |
| **Hover** | `shadow-md` | `-translate-y-1` |

#### Accessibility

- Each hero image must have descriptive `alt={hero.name}`
- Consider adding `aria-label={`View ${hero.name} profile`}`

---

### 2.8 Top Rated Comics Grid

**Location:** [`src/components/organisms/Dashboard/DashboardLayout.tsx`](src/components/organisms/Dashboard/DashboardLayout.tsx:453)

#### Structure

```tsx
<div className="mt-2">
  <h3 className="text-2xl font-bold mb-6 text-slate-900">Top Rated Comics</h3>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
    {topRatedComics.map((comic, idx) => (
      <div key={idx} className="group cursor-pointer flex flex-col">
        {/* Comic Cover */}
        <div className="relative rounded-2xl overflow-hidden mb-3 aspect-[2/3] shadow-sm group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
          <img 
            src={comic.coverUrl} 
            alt={comic.title} 
            className="w-full h-full object-cover"
          />
        </div>
        {/* Comic Info */}
        <h4 className="font-bold text-blue-600 text-sm leading-tight mb-1 group-hover:underline decoration-2 underline-offset-2">
          {comic.title}
        </h4>
        <p className="text-xs text-slate-500 font-semibold">{comic.author}</p>
      </div>
    ))}
  </div>
</div>
```

#### Comic Data Structure

```tsx
interface Comic {
  title: string;
  author: string;
  coverUrl: string;
}

const topRatedComics: Comic[] = [
  { title: 'All New Wolverine', author: 'Tom Raney', coverUrl: '...' },
  { title: 'X-Men (2019) #1', author: 'Jonathan Hickman', coverUrl: '...' },
  // ... 4 more
];
```

#### Responsive Grid

| Breakpoint | Columns | Tailwind Class |
|------------|---------|----------------|
| Mobile | 2 | `grid-cols-2` |
| Tablet (`md:`) | 3 | `md:grid-cols-3` |
| Desktop (`lg:`) | 6 | `lg:grid-cols-6` |

#### Card Specifications

| Property | Value |
|----------|-------|
| Border Radius | `rounded-2xl` |
| Aspect Ratio | `aspect-[2/3]` |
| Gap | `gap-6` |
| Image Object Fit | `object-cover` |

#### Title States

| State | Color | Text Decoration |
|-------|-------|-----------------|
| **Default** | `blue-600` | none |
| **Hover** | `blue-600` | `underline decoration-2 underline-offset-2` |

#### Card States

| State | Shadow | Transform |
|-------|--------|-----------|
| **Default** | `shadow-sm` | none |
| **Hover** | `shadow-xl` | `-translate-y-1` |

---

## 3. Usage Compliance Checklist

Use this checklist to audit existing components against documented standards.

### 3.1 Sidebar Navigation

- [ ] Logo text is "Geek" with `text-3xl font-extrabold tracking-tight`
- [ ] Sidebar width is `280px` (`w-[280px]`)
- [ ] Sidebar padding is `py-10 px-8`
- [ ] Nav items use `space-y-2` for vertical spacing
- [ ] Nav buttons use `rounded-2xl` border radius
- [ ] Active state uses `bg-blue-500 text-white`
- [ ] Active state has `shadow-lg shadow-blue-500/30`
- [ ] Active state has `translate-x-1` transform
- [ ] Inactive text is `slate-500`, icon is `slate-400`
- [ ] Hover state uses `hover:bg-slate-50 hover:text-slate-900`
- [ ] Icons use `size={20}` with `strokeWidth` of 2 or 2.5

### 3.2 Header / Search

- [ ] Search bar max-width is `500px` (`max-w-[500px]`)
- [ ] Search input uses `rounded-2xl`
- [ ] Search icon positioned at `left-5` with vertical centering
- [ ] Focus state uses `focus:ring-2 focus:ring-blue-500`
- [ ] Notification bell has red dot indicator (`bg-red-500`)
- [ ] User avatar is `44x44px` with `rounded-full`
- [ ] User name uses `font-semibold text-slate-700`

### 3.3 Hero Card

- [ ] Uses `col-span-12 lg:col-span-8` grid placement
- [ ] Border radius is `rounded-[2rem]`
- [ ] Background image uses `absolute inset-0`
- [ ] Gradient overlay: `from-slate-900/90 via-slate-900/30 to-transparent`
- [ ] Title uses `text-4xl font-extrabold`
- [ ] Author uses `text-slate-300`
- [ ] CTA button is `bg-blue-500 hover:bg-blue-600 rounded-full`
- [ ] CTA has `shadow-lg shadow-blue-500/30`
- [ ] Hover on card triggers `scale-105` on image with `duration-700`

### 3.4 Continue Reading Widget

- [ ] Uses `col-span-12 lg:col-span-4` grid placement
- [ ] Background is `bg-slate-900`
- [ ] Border radius is `rounded-[2rem]`
- [ ] Internal image uses `opacity-50 mix-blend-overlay`
- [ ] CircularProgress component renders correctly
- [ ] Progress stroke uses `blue-500` (#3b82f6)
- [ ] SVG circle has `stroke-linecap="round"`

### 3.5 Favourite Heroes

- [ ] Avatar size is `72x72px` (`w-[72px] h-[72px]`)
- [ ] Border radius is `rounded-full`
- [ ] Background colors: `red-500`, `green-500`, `purple-600`, `yellow-400`
- [ ] Images use `mix-blend-multiply opacity-90`
- [ ] Hover state includes `hover:-translate-y-1 hover:shadow-md`
- [ ] Gap between avatars is `gap-4`

### 3.6 Comics Grid

- [ ] Grid uses `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`
- [ ] Gap is `gap-6`
- [ ] Card border radius is `rounded-2xl`
- [ ] Aspect ratio is `aspect-[2/3]`
- [ ] Title color is `text-blue-600`
- [ ] Author color is `text-slate-500`
- [ ] Hover on card: `group-hover:-translate-y-1 group-hover:shadow-xl`
- [ ] Title hover: `group-hover:underline decoration-2 underline-offset-2`

### 3.7 General

- [ ] Container uses `rounded-[2.5rem]` (40px radius)
- [ ] Container max-width is `max-w-[1400px]`
- [ ] Container height is `h-[850px]`
- [ ] Main background is `#fafcff` (`bg-[#fafcff]`)
- [ ] Page background gradient: `from-blue-100 via-indigo-50 to-pink-100`
- [ ] All transitions use `duration-200` to `duration-300` unless specified otherwise
- [ ] All interactive elements have visible focus states
- [ ] All images have descriptive `alt` text
- [ ] Icons from lucide-react use consistent sizing (16, 20, or 24px)

### 3.8 Accessibility Checklist

- [ ] All buttons have accessible names (`aria-label` or visible text)
- [ ] All images have `alt` text (empty string for decorative)
- [ ] Color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Interactive elements are keyboard accessible
- [ ] Focus indicators are visible (do not use `outline: none` without replacement)
- [ ] Form inputs have associated labels
- [ ] Notifications use `aria-live` for dynamic updates

---

## Component Comparison Tables

### Search Bar

| Property | Expected | Actual |
|----------|----------|--------|
| Max Width | `500px` | `max-w-[500px]` |
| Border Radius | `2xl` (16px) | `rounded-2xl` |
| Icon Size | `20px` | `size={20}` |
| Icon Position | `left-5` | `left-5` |
| Focus Ring | `blue-500` | `focus:ring-2 focus:ring-blue-500` |

### Navigation Button

| Property | Expected | Actual |
|----------|----------|--------|
| Padding | `px-6 py-4` | `px-6 py-4` |
| Border Radius | `2xl` (16px) | `rounded-2xl` |
| Active BG | `blue-500` | `bg-blue-500` |
| Active Text | `white` | `text-white` |
| Active Shadow | `blue-500/30` | `shadow-lg shadow-blue-500/30` |

### Comic Card

| Property | Expected | Actual |
|----------|----------|--------|
| Border Radius | `2xl` (16px) | `rounded-2xl` |
| Aspect Ratio | `2:3` | `aspect-[2/3]` |
| Title Color | `blue-600` | `text-blue-600` |
| Author Color | `slate-500` | `text-slate-500` |
| Hover Transform | `-translate-y-1` | `group-hover:-translate-y-1` |
| Hover Shadow | `xl` | `group-hover:shadow-xl` |

---

## Inline Code Examples

### Basic Page Structure

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100 flex items-center justify-center p-4 sm:p-8 font-sans text-slate-900">
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] w-full max-w-[1400px] h-[850px] flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-10 flex flex-col gap-10 overflow-y-auto bg-[#fafcff]">
          <Header />
          <HeroSection />
          <ComicsGrid />
        </main>
      </div>
    </div>
  );
}
```

### NavButton with Active State

```tsx
function NavButton({ icon: Icon, label, isActive }: NavButtonProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold transition-all duration-200',
        isActive
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 translate-x-1'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} strokeWidth={isActive ? 2.5 : 2} />
      {label}
    </button>
  );
}
```

### CircularProgress with Animation

```tsx
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-16 h-16">
        <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="#3b82f6"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{percentage}%</span>
      </div>
    </div>
  );
}
```

---

*Document Version: 1.0*
*Last Updated: 2026-04-17*
*Maintainer: Comet 2.0 Design System*