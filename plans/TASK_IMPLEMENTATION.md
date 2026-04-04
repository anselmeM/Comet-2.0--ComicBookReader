# Comet 2.0 Comic Book Reader - Task Implementation Guide

## Project Overview

Comet 2.0 is a modern comic book reader application built with Next.js 16, featuring authentication, library management, and reading progress tracking. This document outlines the current development status and provides a structured task list for ongoing improvements.

### Current Development Context

**Recent Changes:**
- DashboardLayout.tsx enhanced with stateful navigation and toast notification integration
- New LIBRARY_ANALYSIS.md created with improvement recommendations
- Toast notification system implemented via React Context API
- CBR format support added via node-unrar-js WASM module

**Technology Stack:**
- Next.js 16.1.6 (App Router with Turbopack)
- NextAuth v5 (Auth.js) with Credentials provider
- Prisma ORM with SQLite database
- React Query (TanStack Query) for data fetching
- @dnd-kit for drag-and-drop functionality
- Framer Motion for animations
- Tailwind CSS v4 for styling

---

## Task List Structure

### Task Categories

| ID | Category | Priority | Status |
|----|----------|----------|--------|
| T1 | Library Page | HIGH | Completed |
| T2 | Notification System | MEDIUM | Completed |
| T3 | Dashboard | MEDIUM | Completed |
| T4 | Schema Updates | LOW | Completed |
| T5 | Performance | HIGH | Completed (T5.2 optional) |

---

## T1: Library Page Improvements

### T1.1 Search with Debounce

**Priority:** HIGH
**Dependencies:** None
**Status:** ✅ Completed

#### Implementation Steps

1. **Create debounce hook** - `src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

2. **Update DashboardLayout.tsx** - Add debounce to search

```typescript
import { useDebounce } from '@/hooks/useDebounce';

// In component:
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

// Update filtered comics
const filteredComics = useMemo(() => {
  return comics.filter(comic =>
    comic.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
}, [comics, debouncedSearch]);
```

3. **Integration Points:**
- Search input onChange updates `searchQuery`
- `debouncedSearch` used in useMemo for filtering
- No API changes required

#### Acceptance Criteria
- [ ] Search filters as user types with 300ms delay
- [ ] No excessive re-renders during typing
- [ ] Clear search button appears when query exists

---

### T1.2 Reading Status Filters

**Priority:** HIGH
**Dependencies:** None
**Status:** ✅ Completed

#### Implementation Steps

1. **Add filter state to DashboardLayout.tsx**

```typescript
type ReadingStatus = 'all' | 'unread' | 'in_progress' | 'completed';

const [statusFilter, setStatusFilter] = useState<ReadingStatus>('all');
```

2. **Create filter dropdown in header**

```typescript
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value as ReadingStatus)}
  className="bg-gray-50 border rounded-lg px-3 py-2"
>
  <option value="all">All Comics</option>
  <option value="unread">Unread</option>
  <option value="in_progress">In Progress</option>
  <option value="completed">Completed</option>
</select>
```

3. **Update filtering logic**

```typescript
const filteredComics = useMemo(() => {
  let result = comics;

  // Apply search filter
  if (debouncedSearch) {
    result = result.filter(comic =>
      comic.title.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    result = result.filter(comic => {
      if (!comic.progress) return statusFilter === 'unread';
      const progressPercent = (comic.progress.lastPage / comic.progress.totalPages) * 100;

      if (statusFilter === 'unread') return progressPercent === 0;
      if (statusFilter === 'in_progress') return progressPercent > 0 && progressPercent < 100;
      if (statusFilter === 'completed') return progressPercent === 100;
      return true;
    });
  }

  return result;
}, [comics, debouncedSearch, statusFilter]);
```

#### Acceptance Criteria
- [ ] Filter dropdown visible in header
- [ ] Correct comics shown for each filter option
- [ ] Filters work in combination with search

---

### T1.3 Sorting Options

**Priority:** MEDIUM
**Dependencies:** None
**Status:** ✅ Completed

#### Implementation Steps

1. **Add sort state**

```typescript
type SortOption = 'recent' | 'title_asc' | 'progress' | 'added';

const [sortBy, setSortBy] = useState<SortOption>('recent');
```

2. **Add sort dropdown next to filter**

```typescript
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value as SortOption)}
  className="bg-gray-50 border rounded-lg px-3 py-2"
>
  <option value="recent">Recently Read</option>
  <option value="title_asc">Title (A-Z)</option>
  <option value="progress">Reading Progress</option>
  <option value="added">Date Added</option>
</select>
```

3. **Implement sorting logic in useMemo**

```typescript
const sortedComics = useMemo(() => {
  const sorted = [...filteredComics];

  switch (sortBy) {
    case 'title_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'progress':
      return sorted.sort((a, b) => {
        const aProgress = a.progress ? a.progress.lastPage / a.progress.totalPages : 0;
        const bProgress = b.progress ? b.progress.lastPage / b.progress.totalPages : 0;
        return bProgress - aProgress;
      });
    case 'added':
      return sorted.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    case 'recent':
    default:
      return sorted.sort((a, b) => {
        if (!a.lastReadAt && !b.lastReadAt) return 0;
        if (!a.lastReadAt) return 1;
        if (!b.lastReadAt) return -1;
        return new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime();
      });
  }
}, [filteredComics, sortBy]);
```

#### Acceptance Criteria
- [ ] Sort dropdown with 4 options
- [ ] Comics reorder correctly based on selection
- [ ] Sort persists during search/filter operations

---

## T2: Notification System Implementation

### T2.1 Technical Specifications

**Status:** COMPLETED

#### Context Structure

```typescript
// Location: src/components/atoms/Toast/Toast.tsx

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface NotificationContextType {
  triggerNotification: (message: string, type?: ToastType) => void;
}
```

#### Provider Implementation

```typescript
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const triggerNotification = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ... render toasts with AnimatePresence
}
```

#### Integration Points

1. **App Provider** - Wraps entire app
   - File: `src/app/providers.tsx`
   - Added `<NotificationProvider>` wrapper

2. **Usage in Components**
   - Import: `import { useNotification } from '@/components/atoms/Toast';`
   - Call: `const { triggerNotification } = useNotification();`
   - Trigger: `triggerNotification('Message', 'success');`

#### Current Toast Usage in DashboardLayout

```typescript
// Navigation clicks
<button onClick={() => triggerNotification(`Navigated to ${view}`)}>

// Comic card clicks
<Link onClick={() => triggerNotification(`Opening "${comic.title}"...`)}>

// View toggle
<button onClick={() => triggerNotification(`Switched to ${view} view`)}>
```

#### Acceptance Criteria
- [x] ToastProvider wraps application
- [x] useNotification hook accessible in all components
- [x] Auto-dismiss after 3 seconds
- [x] Success/Error/Info types with distinct styling
- [x] Manual dismiss via X button
- [x] Smooth animations via Framer Motion

---

### T2.2 Extended Notification Features

**Priority:** MEDIUM
**Dependencies:** T2.1 (Completed)
**Status:** ✅ Completed

#### Implementation: Undo Functionality

1. **Add action callback to toast**

```typescript
interface ToastWithAction extends Toast {
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // Allow custom duration
}
```

2. **Update trigger function**

```typescript
const triggerNotification = useCallback((
  message: string,
  type: ToastType = 'info',
  action?: { label: string; onClick: () => void },
  duration: number = 3000
) => {
  const id = Math.random().toString(36).substring(7);
  setToasts((prev) => [...prev, { id, message, type, action }]);

  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, duration);
}, []);
```

3. **Render action button in toast**

```typescript
{toast.action && (
  <button
    onClick={() => {
      toast.action.onClick();
      removeToast(toast.id);
    }}
    className="text-blue-400 hover:text-blue-300 font-medium"
  >
    {toast.action.label}
  </button>
)}
```

#### Use Case: Delete with Undo

```typescript
const handleDelete = (comicId: string) => {
  // Immediately remove from UI
  setComics(prev => prev.filter(c => c.id !== comicId));

  // Show toast with undo
  triggerNotification(
    'Comic deleted',
    'info',
    { label: 'Undo', onClick: () => restoreComic(comicId) },
    5000 // Longer duration for undo window
  );
};
```

#### Acceptance Criteria
- [ ] Action button appears in toast when provided
- [ ] Clicking action executes callback and closes toast
- [ ] Delete operations show undo option with 5s window

---

## T3: Dashboard Enhancements

### T3.1 Top Rated Section Enhancement

**Priority:** MEDIUM
**Dependencies:** None
**Status:** ✅ Completed

#### Current State
- Uses hardcoded demo data: `topRatedComics` array in DashboardLayout.tsx
- Not connected to user's actual library

#### Implementation Steps

1. **Option A: Local Rating System**

```prisma
// Update schema.prisma
model Comic {
  rating Int @default(0)  // 0-5 stars
  // ...
}
```

2. **Update API to include rating**

```typescript
// In library API response, include rating field
```

3. **Replace hardcoded data with user's top rated**

```typescript
// In DashboardLayout.tsx, replace:
const topRatedComics = useMemo(() => {
  return [...comics]
    .filter(c => c.rating && c.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);
}, [comics]);
```

#### Acceptance Criteria
- [ ] Top Rated shows actual comics from user's library
- [ ] Fallback to demo data when no rated comics exist
- [ ] Rating displayed on comic cards

---

### T3.2 Series/Collection Grouping

**Priority:** HIGH
**Dependencies:** T4.1 (Schema update)
**Status:** ✅ Completed

#### Implementation Steps

1. **Group comics by series**

```typescript
interface SeriesGroup {
  name: string;
  comics: DashboardComic[];
  coverUrl?: string;
}

const seriesGroups = useMemo(() => {
  const groups: Map<string, SeriesGroup> = new Map();

  comics.forEach(comic => {
    const seriesName = comic.series || 'Uncategorized';
    if (!groups.has(seriesName)) {
      groups.set(seriesName, {
        name: seriesName,
        comics: [],
        coverUrl: comic.coverUrl
      });
    }
    groups.get(seriesName)!.comics.push(comic);
  });

  return Array.from(groups.values());
}, [comics]);
```

2. **Add series view mode**

```typescript
const [viewMode, setViewMode] = useState<'grid' | 'series'>('grid');
```

3. **Render series groups**

```typescript
{viewMode === 'series' && seriesGroups.map(group => (
  <div key={group.name} className="mb-8">
    <h3 className="text-xl font-bold mb-4">{group.name}</h3>
    <div className="grid grid-cols-6 gap-4">
      {group.comics.map(comic => (
        <ComicCard key={comic.id} comic={comic} />
      ))}
    </div>
  </div>
))}
```

#### Acceptance Criteria
- [ ] Comics grouped by series when series data exists
- [ ] "Uncategorized" group for comics without series
- [ ] Toggle between grid and series view

---

## T4: Schema Updates

### T4.1 Add Missing Fields

**Priority:** LOW
**Dependencies:** None
**Status:** ✅ Completed

#### Recommended Schema Changes

```prisma
model Comic {
  // ... existing fields
  series      String?       // Add for grouping
  isFavorite  Boolean @default(false)  // Quick access
  rating      Int @default(0)  // 1-5 stars
  tags        String?       // JSON array: ["Marvel", "Spider-Man"]
  // ...
}
```

#### Migration Steps

1. **Update schema.prisma**

2. **Generate migration**
```bash
npx prisma migrate dev --name add_library_fields
```

3. **Update API types**
- Modify LibraryComic type in `src/hooks/useLibrary.ts`
- Update DashboardComic interface in DashboardLayout.tsx

4. **Update UI components**
- Add favorite toggle to ComicCard
- Add rating display
- Add tag display

#### Acceptance Criteria
- [ ] Database migration completes successfully
- [ ] API returns new fields
- [ ] UI displays favorite, rating, tags

---

## T5: Performance Improvements

### T5.1 Pagination Implementation

**Priority:** HIGH
**Dependencies:** None
**Status:** ✅ Completed

#### Implementation Steps

1. **Add pagination to API**

```typescript
// src/app/api/library/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const comics = await db.comic.findMany({
    take: limit,
    skip: (page - 1) * limit,
    // ... existing query
  });

  return NextResponse.json({
    data: comics,
    pagination: {
      page,
      limit,
      total: await db.comic.count(),
      pages: Math.ceil(total / limit)
    }
  });
}
```

2. **Update useLibrary hook**

```typescript
const { data, ... } = useQuery({
  queryKey: ['library', page],
  queryFn: () => fetch(`/api/library?page=${page}`).then(r => r.json())
});
```

3. **Add pagination controls to UI**

```typescript
const [page, setPage] = useState(1);

<div className="flex justify-center gap-2 mt-8">
  <button
    disabled={page === 1}
    onClick={() => setPage(p => p - 1)}
  >
    Previous
  </button>
  <span>Page {page} of {totalPages}</span>
  <button
    disabled={page >= totalPages}
    onClick={() => setPage(p => p + 1)}
  >
    Next
  </button>
</div>
```

#### Acceptance Criteria
- [ ] API supports page/limit parameters
- [ ] UI shows pagination controls
- [ ] Changing page loads new data

---

### T5.2 Virtual Scrolling

**Priority:** MEDIUM
**Dependencies:** T5.1
**Status:** ⏭️ Optional - Skipped (not needed for current library size)

#### Implementation with react-window

1. **Install dependency**
```bash
npm install react-window
```

2. **Replace grid with virtual list**

```typescript
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={6}
  rowCount={Math.ceil(comics.length / 6)}
  columnWidth={200}
  rowHeight={320}
  width={containerWidth}
  height={600}
>
  {({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 6 + columnIndex;
    if (index >= comics.length) return null;
    return <ComicCard style={style} comic={comics[index]} />;
  }}
</FixedSizeGrid>
```

#### Acceptance Criteria
- [ ] Large libraries (100+ comics) render smoothly
- [ ] Scroll performance stays at 60fps
- [ ] Responsive column count based on viewport

---

## Development Timeline

### Phase 1: Quick Wins (Week 1)

| Task | Effort | Dependencies |
|------|--------|--------------|
| T1.1 Search Debounce | 2 hours | None |
| T1.2 Status Filters | 4 hours | None |
| T1.3 Sorting Options | 3 hours | None |
| T2.2 Undo Actions | 4 hours | T2.1 |

**Milestone:** Search and filter functionality complete

### Phase 2: Data & UI (Week 2)

| Task | Effort | Dependencies |
|------|--------|--------------|
| T3.1 Top Rated Enhancement | 6 hours | T4.1 |
| T3.2 Series Grouping | 8 hours | T4.1 |
| T4.1 Schema Fields | 4 hours | None |

**Milestone:** Enhanced library organization

### Phase 3: Performance (Week 3)

| Task | Effort | Dependencies |
|------|--------|--------------|
| T5.1 Pagination | 6 hours | None |
| T5.2 Virtual Scrolling | 8 hours | T5.1 |

**Milestone:** Large library support

---

## Blocker List

| Blocker | Description | Resolution |
|---------|-------------|-------------|
| B1 | No series data in existing comics | Populate series from metadata or allow manual entry |
| B2 | Hardcoded demo data in Top Rated | Replace with actual library data once rating implemented |
| B3 | Large file uploads block UI | Move parsing to background worker with progress updates |

---

## Testing Requirements

### Unit Tests

```typescript
// hooks/useDebounce.test.ts
describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('returns debounced value after delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );

    rerender({ value: 'updated', delay: 100 });
    expect(result.current).toBe('initial');

    await waitFor(() => expect(result.current).toBe('updated'));
  });
});
```

### Integration Tests

```typescript
// library-flow.spec.ts
test('complete library flow', async () => {
  // 1. Login
  await login('test@example.com', 'password');

  // 2. Upload comic
  await uploadComic('sample.cbz');
  await waitFor(() => expect(toastVisible('Comic added')));

  // 3. Search and filter
  await search('Spider');
  await filterByStatus('in_progress');

  // 4. Sort and verify
  await sortBy('title_asc');
  await expect(comicsSortedAlphabetically());
});
```

### Acceptance Criteria Summary

| Feature | Criteria |
|---------|----------|
| Search Debounce | 300ms delay, no excessive re-renders |
| Status Filter | 4 filter options, correct filtering |
| Sorting | 4 sort options, correct ordering |
| Toast System | Auto-dismiss, manual dismiss, type styles |
| Undo Actions | 5s window, action executes correctly |
| Pagination | Page controls work, data loads correctly |
| Virtual Scroll | 60fps with 100+ items |

---

## Conclusion

This implementation guide provides a structured approach to enhancing the Comet 2.0 library functionality. Priority items (T1.x and T2.x) can be completed in the first phase, with subsequent phases addressing data organization and performance optimization.

The notification system is already in place and can be extended with undo functionality. Schema updates enable more sophisticated library organization features, while pagination and virtual scrolling address performance concerns for larger collections.