# Dashboard UI Update - Implementation Tasks

## Phase 1: Sidebar & Navigation
- [x] Update sidebar logo from "Comet" to "Geek"
- [x] Replace navItems array with: Dashboard, My collections, Favourites, Coming soon, Friends
- [x] Update bottom nav items to Settings, Log out with appropriate icons
- [x] Apply blue-500 active state styling with white text and shadow

## Phase 2: Header Section
- [x] Create search bar with max-width 500px, rounded-2xl styling
- [x] Add notification Bell icon with red indicator dot
- [x] Add user profile section with avatar (Melissa Doe) and name

## Phase 3: Hero Section Grid
- [x] Create 12-column grid layout (lg:col-span-8 + lg:col-span-4)
- [x] Build Featured Hero Card with:
  - Background image from Unsplash
  - Gradient overlay (slate-900/90 to transparent)
  - Author credit: "Nick Spencer"
  - Title: "the Amazing Spider-Man Vol. 1: Back To Basics"
  - "Read Now" button (blue-500, rounded-full, shadow)
- [x] Build Continue Reading Widget with:
  - Dark slate-900 background rounded-2rem
  - Comic title: "Peter Parker: The Spectacular Spider-Man #309"
  - CircularProgress component showing 76%

## Phase 4: Favourite Heroes Section
- [x] Create "Your Favourite Heroes" section
- [x] Add 4 circular avatar chips (72x72px)
- [x] Apply colored backgrounds (red-500, green-500, purple-600, yellow-400)
- [x] Use mix-blend-multiply for image integration
- [x] Add hover effects (translate-y-1, shadow-md)

## Phase 5: Top Rated Comics Grid
- [x] Create "Top Rated Comics" section
- [x] Build responsive grid (2 cols → 3 cols → 6 cols)
- [x] Add 6 comic cards with:
  - Rounded-2xl containers
  - Blue-600 titles with hover underline
  - Author names in slate-500

## Phase 6: Container Styling
- [x] Apply gradient background (blue-100 → indigo-50 → pink-100)
- [x] Set container max-width 1400px, height 850px
- [x] Apply rounded-[2.5rem] with shadow
- [x] Set main content background to #fafcff

## Phase 7: Mock Data Integration
- [x] Define navItems, bottomNavItems arrays
- [x] Define topRatedComics array with 6 comics
- [x] Define favouriteHeroes array with 4 heroes
- [x] Ensure CircularProgress component is available inline

## Phase 8: Testing & Verification
- [x] Verify all hover states work correctly
- [x] Verify responsive grid breakpoints
- [x] Verify circular progress renders correctly
- [x] Confirm all icons from lucide-react are available

## Phase 9: Functional Expansion & Refinement
- [x] **Custom Collections:** Implement creating/editing/deleting custom named lists
- [x] **Bulk Actions Expansion:** Add "Move to Collection" to the Bulk Action Fab
- [x] **Dynamic Hero:** Connect Hero section to real user statistics (most read hero)
- [x] **Data Enrichment:** Link "Read Now" buttons to real ComicVine metadata via `useEnrichment`
- [x] **Guided View Tuning:** Refine panel detection algorithms and add manual panel editing mode

## Phase 10: Social Features & Production Readiness
- [x] **Friends View:** Replace placeholder with real social activity feed
- [x] **Social Reading:** Implement follow/unfollow and public collection sharing
- [x] **Error Boundaries:** Implement robust error handling for modular dashboard views
- [x] **PWA Audit:** Verify offline caching for all new modular components and icons
- [x] **Performance Audit:** Final check of LCP/CLS after refactoring to modular views
