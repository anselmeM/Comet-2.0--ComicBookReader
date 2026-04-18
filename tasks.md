# Dashboard UI Update - Implementation Tasks

## Phase 1: Sidebar & Navigation
- [ ] Update sidebar logo from "Comet" to "Geek"
- [ ] Replace navItems array with: Dashboard, My collections, Favourites, Coming soon, Friends
- [ ] Update bottom nav items to Settings, Log out with appropriate icons
- [ ] Apply blue-500 active state styling with white text and shadow

## Phase 2: Header Section
- [ ] Create search bar with max-width 500px, rounded-2xl styling
- [ ] Add notification Bell icon with red indicator dot
- [ ] Add user profile section with avatar (Melissa Doe) and name

## Phase 3: Hero Section Grid
- [ ] Create 12-column grid layout (lg:col-span-8 + lg:col-span-4)
- [ ] Build Featured Hero Card with:
  - Background image from Unsplash
  - Gradient overlay (slate-900/90 to transparent)
  - Author credit: "Nick Spencer"
  - Title: "the Amazing Spider-Man Vol. 1: Back To Basics"
  - "Read Now" button (blue-500, rounded-full, shadow)
- [ ] Build Continue Reading Widget with:
  - Dark slate-900 background rounded-2rem
  - Comic title: "Peter Parker: The Spectacular Spider-Man #309"
  - CircularProgress component showing 76%

## Phase 4: Favourite Heroes Section
- [ ] Create "Your Favourite Heroes" section
- [ ] Add 4 circular avatar chips (72x72px)
- [ ] Apply colored backgrounds (red-500, green-500, purple-600, yellow-400)
- [ ] Use mix-blend-multiply for image integration
- [ ] Add hover effects (translate-y-1, shadow-md)

## Phase 5: Top Rated Comics Grid
- [ ] Create "Top Rated Comics" section
- [ ] Build responsive grid (2 cols → 3 cols → 6 cols)
- [ ] Add 6 comic cards with:
  - Rounded-2xl containers
  - Blue-600 titles with hover underline
  - Author names in slate-500

## Phase 6: Container Styling
- [ ] Apply gradient background (blue-100 → indigo-50 → pink-100)
- [ ] Set container max-width 1400px, height 850px
- [ ] Apply rounded-[2.5rem] with shadow
- [ ] Set main content background to #fafcff

## Phase 7: Mock Data Integration
- [ ] Define navItems, bottomNavItems arrays
- [ ] Define topRatedComics array with 6 comics
- [ ] Define favouriteHeroes array with 4 heroes
- [ ] Ensure CircularProgress component is available inline

## Phase 8: Testing & Verification
- [ ] Verify all hover states work correctly
- [ ] Verify responsive grid breakpoints
- [ ] Verify circular progress renders correctly
- [ ] Confirm all icons from lucide-react are available
