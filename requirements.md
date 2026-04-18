# Dashboard UI Update Specification

## Context
Update the existing `DashboardLayout.tsx` component with a new lib-ui design featuring a modern comic reader dashboard with hero sections, favorite heroes, and top rated comics.

## User Story
As a user, I want to see a visually appealing dashboard that highlights featured comics, shows my reading progress, displays favorite heroes, and provides quick access to top-rated comics.

## UI Changes

### 1. Sidebar Navigation
- Logo: "Geek" (instead of "Comet")
- Nav items: Dashboard, My collections, Favourites, Coming soon, Friends
- Bottom items: Settings, Log out
- Active state: Blue background with white text and shadow

### 2. Header Section
- Search bar (500px max-width, rounded-2xl)
- Bell notification icon with red indicator
- User profile with avatar (Melissa Doe)

### 3. Featured Hero Card (8 columns)
- Full-width rounded-2rem container
- Background image with gradient overlay (slate-900/90 to transparent)
- Author credit: "Nick Spencer"
- Title: "the Amazing Spider-Man Vol. 1: Back To Basics"
- "Read Now" button (blue-500, rounded-full)

### 4. Continue Reading Widget (4 columns)
- Dark background (slate-900) rounded-2rem
- Circular progress indicator showing percentage
- Comic title: "Peter Parker: The Spectacular Spider-Man #309"
- Progress: 76%

### 5. Favourite Heroes Section
- 4 circular avatar chips (72x72px)
- Colored backgrounds (red-500, green-500, purple-600, yellow-400)
- Images with mix-blend-multiply effect
- Hover: translate-y-1 and shadow

### 6. Top Rated Comics Grid
- 6-column grid (2 cols mobile, 3 cols tablet, 6 cols desktop)
- Comic cards with rounded-2xl containers
- Title in blue-600 with hover underline
- Author name in slate-500

## Technical Approach
- Use existing Tailwind CSS classes (no arbitrary values)
- Maintain React functional component structure
- Keep existing TypeScript interfaces where applicable
- Use lucide-react icons as specified
- No external state management changes required

## Files to Modify
- `src/components/organisms/Dashboard/DashboardLayout.tsx`