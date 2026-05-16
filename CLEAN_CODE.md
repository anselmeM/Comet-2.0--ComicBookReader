# Clean Code Guide - Comet 2.0

> "Code is clean if it can be read, and enhanced by a developer other than its original author." — Grady Booch

This guide establishes clean code standards for the Comet 2.0 Comic Book Reader project, following Robert C. Martin's principles.

---

## 1. Meaningful Names

### Use Intention-Revealing Names

**Good:**

```typescript
const elapsedTimeInDays = computeElapsedTime(startDate, endDate);
const userHasCompletedOnboarding = session.user.hasCompletedOnboarding;
```

**Avoid:**

```typescript
const d = computeElapsedTime(a, b); // What is d?
const flag = session.user.on; // Meaningless
```

### Make Meaningful Distinctions

| Avoid                  | Use Instead          |
| ---------------------- | -------------------- |
| `userData`             | `userProfile`        |
| `getUserData()`        | `fetchUserProfile()` |
| `accountList` (if Map) | `userById`           |

### Class Names

- **Use nouns**: `ComicLibrary`, `BookmarkPanel`, `ReadingProgress`
- **Avoid**: `Manager`, `Handler`, `Data`, `Util`

### Method Names

- **Use verbs**: `deleteComic()`, `updateProgress()`, `postPayment()`
- **Boolean returns**: `isValid()`, `hasAccess()`, `canUpload()`

---

## 2. Functions

### Small and Focused

**Target:** < 20 lines per function

**Good:**

```typescript
export async function deleteComic(comicId: string, userId: string) {
  const comic = await db.comic.findUnique({ where: { id: comicId } });
  if (!comic) throw new NotFoundError('Comic not found');
  if (comic.userId !== userId) throw new ForbiddenError();

  await db.comic.delete({ where: { id: comicId } });
}
```

**Avoid:** Functions doing multiple things (fetch + validate + transform + save)

### One Thing Per Function

Each function should do one thing:

- `validateInput()` - only validate
- `saveToDatabase()` - only save
- `sendEmail()` - only email

### Limit Arguments

| Arguments | Recommendation       |
| --------- | -------------------- |
| 0         | Ideal                |
| 1-2       | Fine                 |
| 3+        | Use object parameter |

**Good with object:**

```typescript
function updateUserProfile({ name, email, image }: UserProfileUpdate) {
  // implementation
}
```

---

## 3. Comments

### Don't Comment Bad Code—Rewrite It

**Instead of:**

```typescript
// Check if user is logged in
if (user && user.id) { ... }
```

**Use:**

```typescript
if (user.isAuthenticated()) { ... }
```

### Good Comments (Keep)

- **Legal**: License headers
- **Informative**: Complex regex intent
- **TODOs**: `// TODO(username): Add pagination`
- **Clarification**: External library behavior

**Example:**

```typescript
// matches ComicVine API response format
// { id: string, name: string, issue_number: number }
interface ComicVineIssue { ... }
```

### Bad Comments (Remove)

- Redundant (`// Loop through array`)
- Misleading
- Commented-out code
- Position markers (`// === SECTION ===`)

---

## 4. Formatting

### Vertical Density

Related code should be close:

```typescript
// 1. Authenticate
const session = await auth();
if (!session?.user?.id) {
  return error('Unauthorized');
}

// 2. Fetch data
const comic = await db.comic.findUnique({ where: { id } });
if (!comic) return error('Not found');

// 3. Validate ownership
if (comic.userId !== session.user.id) {
  return error('Forbidden');
}
```

### The Stepdown Rule

High-level concepts at the top:

```typescript
export async function DELETE(req, { params }) {
  // High-level: validation, authorization
  const session = await requireAuth();
  const { comicId } = await params;

  // Mid-level: fetch and validate
  const comic = await fetchComicOrThrow(comicId);
  verifyOwnership(comic, session.user.id);

  // Low-level: delete
  await db.comic.delete({ where: { id: comicId } });
}
```

---

## 5. Objects and Data Structures

### Data Abstraction

**Good - hide implementation:**

```typescript
class ComicLibrary {
  private comics: Map<string, Comic>;

  getComic(id: string) {
    return this.comics.get(id);
  }
}
```

**Avoid - leaky abstraction:**

```typescript
class ComicLibrary {
  comics: Map<string, Comic>; // Exposing internals
}
```

### Law of Demeter

**Avoid:**

```typescript
const user = session.user.id; // session -> user -> id chain
comic.progress.lastPage; // comic -> progress -> lastPage chain
```

**Use:**

```typescript
const userId = getCurrentUserId();
const lastPage = getLastPage(comic);
```

### DTOs for API Responses

```typescript
// Return only what the client needs
const ComicResponse = {
  id: string,
  title: string,
  coverUrl: string | null,
  progress: { lastPage: number, totalPages: number } | null,
};
```

---

## 6. Error Handling

### Use Exceptions

**Good:**

```typescript
try {
  await db.comic.delete({ where: { id } });
} catch (error) {
  console.error('Delete failed:', error);
  throw new Error('Failed to delete comic');
}
```

**Avoid return codes:**

```typescript
// Don't do this
const result = deleteComic(id);
if (result === -1) // error!
```

### Write Try-Catch-First

```typescript
export async function handleRequest(req) {
  try {
    return await processRequest(req);
  } catch (error) {
    if (error instanceof ValidationError) {
      return { error: error.message, status: 400 };
    }
    console.error('Unexpected:', error);
    return { error: 'Internal error', status: 500 };
  }
}
```

### Don't Return/Pass Null

**Avoid:**

```typescript
function findUser(id) { return user || null; }
// Caller must check:
const user = findUser(123);
if (user) { ... }
```

**Use Optional:**

```typescript
function findUser(id): Promise<User | null> { ... }
// Or throw
async function getUserOrThrow(id): Promise<User> {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return user;
}
```

---

## 7. Classes

### Single Responsibility (SRP)

**Good - focused classes:**

```typescript
// src/hooks/useLibrary.ts - manages library list
class ComicLibraryManager { ... }

// src/hooks/useBookmarks.ts - manages bookmarks
class BookmarkManager { ... }
```

**Avoid - God classes:**

```typescript
// One file doing everything
class ComicApp {
  // BAD - too many responsibilities
  manageLibrary();
  manageBookmarks();
  manageUser();
  manageParsing();
  manageUploads();
}
```

### Stepdown Rule in Classes

```typescript
class ComicService {
  // Public API first (high level)
  async delete(id) { ... }
  async fetch(id) { ... }

  // Private helpers (low level)
  private validateOwnership() { ... }
  private logAction() { ... }
}
```

---

## 8. Code Smells

### Detect These Issues

| Smell              | Example          | Fix                 |
| ------------------ | ---------------- | ------------------- |
| **Long function**  | >50 lines        | Split into smaller  |
| **Many arguments** | >4 arguments     | Use object          |
| **Duplicate code** | Copied logic     | Extract to function |
| **Magic numbers**  | `if (x > 86400)` | Named constant      |
| **Deep nesting**   | >3 levels        | Extract logic       |

### Fixing Common Smells

**Magic numbers → Constants:**

```typescript
// Before
if (session.maxAge > 2592000) // what?

// After
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
if (session.maxAge > SESSION_MAX_AGE) // clear
```

**Deep nesting → Early return:**

```typescript
// Before (nested)
if (user) {
  if (user.isActive) {
    if (hasPermission) {
      doSomething();
    }
  }
}

// After (early return)
if (!user) return;
if (!user.isActive) return;
if (!hasPermission) return;
doSomething();
```

---

## 9. Implementation Checklist

Before submitting code, verify:

- [ ] Function is < 20 lines
- [ ] Function does one thing
- [ ] Names are searchable (not `x`, `temp`, `data`)
- [ ] No comments covering bad code
- [ ] Arguments ≤ 3 (or object)
- [ ] No magic numbers
- [ ] Early returns for invalid cases
- [ ] Error handling with try-catch
- [ ] No null checks (use Optional or throw)
- [ ] Related code is vertically close

---

## 10. Project-Specific Patterns

### API Route Pattern

```typescript
// src/app/api/comics/[id]/route.ts
export async function DELETE(req, { params }) {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate input
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // 3. Fetch with ownership check
  const comic = await db.comic.findUnique({ where: { id } });
  if (!comic) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (comic.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. Execute
  await db.comic.delete({ where: { id } });

  // 5. Return
  return NextResponse.json({ success: true });
}
```

### Hook Pattern

```typescript
// src/hooks/useFeature.ts
export function useFeature() {
  const query = useQuery({ queryKey: ['feature'], queryFn: fetchFeature });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutate: query.refetch,
  };
}
```

### Schema Pattern

```typescript
// src/lib/schemas.ts
import { z } from 'zod';

export const comicSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1),
  filehash: z.string().length(64),
  pageCount: z.number().int().positive(),
});

export const createComicSchema = comicSchema.omit({ id: true });
```

---

## Quick Reference

| Rule            | Target      |
| --------------- | ----------- |
| Function length | < 20 lines  |
| Arguments       | ≤ 3         |
| Nesting depth   | ≤ 3         |
| Class length    | < 200 lines |
| Method length   | < 10 lines  |
| Comments        | Minimal     |
| Duplication     | 0%          |

---

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler
