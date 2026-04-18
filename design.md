# Dashboard UI Update - Design Specification

## 1. Concept & Vision

A premium comic reader dashboard that feels like stepping into a digital comic shop. The interface balances visual richness with functional clarity, featuring a dark-accented navigation sidebar, prominent hero sections for featured content, and a clean grid layout for browsing the collection. The design evokes the excitement of comic discovery while maintaining professional usability.

## 2. Design Language

### Aesthetic Direction
Modern comic-book inspired with bold typography, vibrant accent colors against neutral backgrounds, and subtle depth through shadows and gradients.

### Color Palette
- **Primary:** `blue-500` (#3b82f6) - CTAs, active states
- **Secondary:** `slate-900` (#0f172a) - Dark widgets, contrast elements
- **Background:** `slate-50` to `indigo-50` to `pink-100` gradient
- **Surface:** `white` (#ffffff) - Cards, elevated surfaces
- **Text Primary:** `slate-900` (#0f172a)
- **Text Secondary:** `slate-500` (#64748b)
- **Accent Hover:** `blue-600` (#2563eb)

### Typography
- Headings: System sans-serif, `font-extrabold`, `tracking-tight`
- Body: `font-semibold` for labels, `font-medium` for content
- Scale: 4xl for hero titles, 2xl/3xl for section headers, base for content

### Spatial System
- Container max-width: `1400px`
- Container height: `850px` (fixed)
- Border radius: `2.5rem` for main containers, `2rem` for cards, `full` for buttons
- Sidebar width: `280px`
- Padding: `10` for main content area

### Motion Philosophy
- Hover: `translate-y-1` with `shadow-xl` elevation
- Transitions: `200-300ms` for color/background, `500-700ms` for image scale
- Active states: `translate-x-1` for sidebar navigation feedback

## 3. Layout & Structure

### Page Structure
```
┌────────────────────────────────────────────────────┐
│  Sidebar (280px)  │     Main Content (flex-1)      │
│                   │                                │
│  [Logo: Geek]     │  [Header: Search + User]       │
│                   │                                │
│  Nav Items        │  [Hero Section Grid]          │
│  - Dashboard      │   ├─ Featured (8 cols)        │
│  - Collections    │   └─ Continue Reading (4 cols) │
│  - Favourites     │      + Favourite Heroes        │
│  - Coming Soon    │                                │
│  - Friends        │  [Top Rated Comics Grid]      │
│                   │                                │
│  [Settings]       │                                │
│  [Log out]        │                                │
└────────────────────────────────────────────────────┘
```

### Responsive Strategy
- Sidebar: Fixed 280px, does not collapse (desktop-focused)
- Grid: 12-column base with 8/4 split for hero section
- Comics grid: `grid-cols-2` mobile → `grid-cols-3` tablet → `grid-cols-6` desktop

## 4. Features & Interactions

### Sidebar Navigation
- Click: Sets active nav item with blue background + white text + shadow
- Hover: `bg-slate-50` background transition on inactive items

### Search Bar
- Focus: Ring-2 with `blue-500` color
- Placeholder: "Search" with search icon prefix

### Notification Bell
- Red dot indicator (top-right of icon)
- Hover: `text-slate-900` transition

### User Avatar
- Hover: Border changes to `blue-500`

### Featured Hero Card
- Hover: Image scales to `105%` over 700ms
- Button: Blue background, hover darkens to blue-600

### Continue Reading Widget
- Circular progress with blue stroke
- Displays percentage in center

### Favourite Heroes
- Circular avatars with colored backgrounds
- Hover: `translate-y-1` with `shadow-md`
- Images use `mix-blend-multiply` for background integration

### Comic Grid Cards
- Hover: `translate-y-1` + `shadow-xl` elevation
- Title: Blue-600, hover shows underline

## 5. Component Inventory

### NavButton
- States: default (slate-500), active (blue-500 bg + white text), hover (slate-50 bg)
- Icon + label layout, rounded-2xl container

### SearchInput
- States: default, focused (ring-2 blue-500)
- Left icon (Search), rounded-2xl, white background

### NotificationButton
- Bell icon with red dot badge
- States: default, hover (darker text)

### UserProfile
- Avatar image (rounded-full) + name label
- States: default, hover (border-blue-500)

### HeroCard
- Background image with gradient overlay
- Title, author, "Read Now" button
- States: default, hover (image zoom)

### ProgressWidget
- Dark slate background
- Title + circular progress indicator
- CircularProgress: SVG circle with blue stroke

### HeroAvatar
- Circular image with colored background
- States: default, hover (lift + shadow)

### ComicCard
- Image container (aspect-2/3) + title + author
- States: default, hover (lift + shadow)

## 6. Technical Approach

### Framework
- React 18+ functional component
- TypeScript with strict typing
- Tailwind CSS v3+ utility classes

### Dependencies
- `lucide-react` for icons
- Existing hooks: `useFavorites`, `useEnrichment`, `useNotification`
- Existing auth: `useSession` from next-auth

### File Structure
- `src/components/organisms/Dashboard/DashboardLayout.tsx` - Main component

### Implementation Notes
- Maintain existing interface compatibility (`DashboardLayoutProps`)
- Use existing mock data structure where possible
- Keep CircularProgress utility inline (reused from user spec)
- All images from Unsplash with proper sizing parameters
