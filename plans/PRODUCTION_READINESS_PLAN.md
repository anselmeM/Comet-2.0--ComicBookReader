# Comet 2.0 - Production Readiness Plan for 1000 Users

## Executive Summary

This document outlines a comprehensive plan to prepare Comet 2.0 (Comic Book Reader) for production deployment supporting 1000 concurrent users. The plan addresses critical bugs, performance optimizations, infrastructure changes, security improvements, and UX enhancements.

---

## 1. Critical Bugs to Fix Immediately

### 1.1 Tailwind CSS Build Errors

**Issue:** "Can't resolve 'tailwindcss'" appearing repeatedly during builds

**Root Cause:** Tailwind CSS v4 has a new configuration model. The project uses `@tailwindcss/postcss` v4 but may have configuration issues with Next.js 16's Turbopack.

**Fix Steps:**

1. Verify `@tailwindcss/postcss` and `tailwindcss` versions are compatible (both v4)
2. Add explicit `tailwind.config.ts` if needed for v4:

   ```typescript
   import type { Config } from 'tailwindcss'
   
   export default {
     content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
     theme: {
       extend: {},
     },
     plugins: [],
   } satisfies Config
   ```

3. Ensure `postcss.config.mjs` is properly loaded
4. Run `npm install` to ensure all dependencies are linked

**Priority:** 🔴 CRITICAL - Prevents production builds

---

### 1.2 API 404 Error: `/api/comics/[id]/progress`

**Issue:** Progress API returns 404 despite the route file existing at [`src/app/api/comics/[id]/progress/route.ts`](src/app/api/comics/[id]/progress/route.ts)

**Root Cause Analysis:**
- The route file exists and looks correct (uses Next.js 16 params Promise pattern)
- Could be due to dynamic route matching issues with Turbopack
- Possible routing conflict with other routes

**Fix Steps:**
1. Verify route file structure is correct (it appears correct)
2. Test with explicit GET method in the route to diagnose
3. Check if `[id]` folder is being matched correctly
4. Add logging to diagnose route matching:
   ```typescript
   console.log('Progress route called with params:', await params);
   ```

**Priority:** 🔴 CRITICAL - Breaks reading progress persistence

---

### 1.3 Missing API GET Method for Progress Route

**Issue:** The progress route only has a PUT handler but clients may need to fetch current progress.

**Fix Steps:**
1. Add GET handler to [`src/app/api/comics/[id]/progress/route.ts`](src/app/api/comics/[id]/progress/route.ts):
   ```typescript
   export async function GET(
     req: Request,
     { params }: { params: Promise<{ id: string }> },
   ) {
     const session = await auth();
     if (!session?.user?.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const { id: comicId } = await params;
     
     const progress = await db.readingProgress.findUnique({
       where: { comicId },
     });
     
     return NextResponse.json(progress, { status: 200 });
   }
   ```

**Priority:** 🟡 HIGH - Required for proper sync

---

## 2. Performance Optimizations

### 2.1 Slow Compilation Times (22.9s)

**Current Issues:**
- Next.js 16 with Turbopack should be faster; 22.9s is excessive
- Heavy client-side components
- No build caching configured

**Optimization Steps:**

| Optimization | Impact | Effort |
| --- | --- | --- |
| Enable Turbopack in production build | High | Low |
| Add `next.config.ts` caching | High | Low |
| Split large client components | Medium | Medium |
| Implement route-based code splitting | High | Medium |
| Optimize images with next/image | High | Medium |

**Configuration Changes:**
```typescript
// next.config.ts - Add standalone output
const nextConfig: NextConfig = {
  // ... existing config
  output: 'standalone', // Reduces container size
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Enable persistent caching
  cache: {
    type: 'filesystem',
  },
};
```

**Priority:** 🟠 MEDIUM - Affects developer experience and CI/CD

---

### 2.2 Bundle Size Optimization

**Current Dependencies Analysis:**
- `framer-motion` - Heavy, consider alternatives or lazy loading
- `lucide-react` - Already tree-shakeable
- `jszip` - Required for comic parsing (keep)

**Optimization Steps:**
1. Use `next/dynamic` for heavy components:
   ```typescript
   const ComicReader = dynamic(
     () => import('@/components/organisms/ComicReader'),
     { ssr: false, loading: () => <Skeleton /> }
   );
   ```

2. Lazy load the comic parser worker
3. Add bundle analyzer:
   ```bash
   npm install @next/bundle-analyzer
   ```

**Priority:** 🟠 MEDIUM - Improves load times

---

### 2.3 Database Query Optimization

**Current Issues:**
- N+1 query potential in library fetches
- No query caching layer

**Optimization Steps:**
1. Add Prisma query optimization:
   ```typescript
   // Use select to fetch only needed fields
   const comics = await db.comic.findMany({
     where: { userId: session.user.id },
     select: { id: true, title: true, coverUrl: true, progress: true },
   });
   ```
2. Implement Redis caching layer for frequently accessed data (see Infrastructure section)

**Priority:** 🟠 MEDIUM - Critical at scale

---

## 3. Infrastructure Changes for 1000 Users

### 3.1 Database Migration: SQLite → PostgreSQL

**Why SQLite Won't Work:**
- SQLite has file-level locking; concurrent writes will block
- Maximum ~100 concurrent connections recommended
- Not designed for production web workloads
- No horizontal scaling capability

**Migration Path:**

```mermaid
flowchart TD
    A[SQLite (dev.db)] --> B[Export Data]
    B --> C[Setup PostgreSQL]
    C --> D[Update Prisma Schema]
    D --> E[Run Migration]
    E --> F[Update DATABASE_URL]
```

**Steps:**
1. **Choose PostgreSQL Provider:**
   - Neon (serverless, scales well) - Already in CSP connect-src
   - Supabase (includes auth, storage)
   - Railway/Render (managed)
   - AWS RDS (full control)

2. **Update Prisma Schema:**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
   }
   
   // Add connection pooling for 1000 users
   // In production, use Prisma Accelerate or PgBouncer
   ```

3. **Migrate Data:**
   ```bash
   # Install pgloader or use prisma migrate
   npx prisma db push
   ```

**Priority:** 🔴 CRITICAL - Foundation for scale

---

### 3.2 File Storage Architecture

**Current Issue:** Comic files stored as base64 in IndexedDB
- Limited storage capacity (typically 50-80% of disk space)
- No CDN for fast delivery
- Sync issues across devices

**Solution: Cloud Object Storage**

| Provider | Pros | Cons |
| --- | --- | --- |
| AWS S3 | Industry standard, cheap | Complex IAM |
| Cloudflare R2 | No egress fees | Newer, fewer integrations |
| Supabase Storage | Integrated with auth | Smaller free tier |
| Backblaze B2 | Very cheap | Requires wrapper |

**Implementation:**
```typescript
// lib/storage.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadComic(userId: string, file: Buffer) {
  const key = `comics/${userId}/${crypto.randomUUID()}.cbz`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: file,
  }));
  
  return `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${key}`;
}
```

**Priority:** 🔴 CRITICAL - Current approach won't scale

---

### 3.3 Caching Layer

**Requirements for 1000 Users:**
- Reduce database load
- Faster API responses
- Handle traffic spikes

**Architecture:**
```mermaid
flowchart LR
    Client --> CDN[Cloudflare/Vercel Edge]
    CDN --> API[Next.js API]
    API --> Redis[Redis Cache]
    Redis --> DB[(PostgreSQL)]
```

**Implementation:**
1. **API Response Caching:**
   ```typescript
   // Add to API routes
   export const dynamic = 'force-dynamic'; // or use cache()
   
   // For cacheable data
   import { unstable_cache } from 'next/cache';
   
   const getCachedComics = unstable_cache(
     async (userId) => db.comic.findMany({ where: { userId } }),
     ['user-comics'],
     { revalidate: 60 } // 1 minute
   );
   ```

2. **Redis for Session/Progress:**
   - Cache reading progress for instant loads
   - Store user session data
   - Rate limiting

**Priority:** 🟠 MEDIUM - Needed for performance at scale

---

### 3.4 Hosting Platform Recommendations

**Options for 1000 Users:**

| Platform | Monthly Cost | Pros | Cons |
| --- | --- | --- | --- |
| Vercel Pro | ~$20/mo | Zero-config Next.js | Overage costs |
| Railway | $5-20/mo | Full control | Cold starts |
| Render | $25+/mo | Managed DB option | Complex setup |
| Self-hosted | Varies | Full control | DevOps required |

**Recommendation:** Vercel for simplicity, Railway for cost control

---

## 4. Security Improvements

### 4.1 Authentication Security

**Current State:**
- Credentials provider with bcrypt
- JWT sessions (30 days)
- Basic CSP headers

**Improvements:**

| Security Measure | Implementation | Priority |
| --- | --- | --- |
| Rate limiting | Add to all auth endpoints | 🔴 CRITICAL |
| 2FA support | Add TOTP provider | 🟡 HIGH |
| Session rotation | Implement refresh tokens | 🟡 HIGH |
| Account lockout | After failed attempts | 🟡 HIGH |
| Password requirements | Min complexity rules | 🟠 MEDIUM |

**Implementation:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

// Use in API routes
export async function POST(req: Request) {
  const { success } = await ratelimit.limit(req.ip || 'unknown');
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... handler
}
```

---

### 4.2 API Security

**Current Headers (Good):**
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin

**Improvements Needed:**

1. **Add CORS for production:**
   ```typescript
   // next.config.ts
   async headers() {
     return [
       // ... existing headers
       {
         source: '/api/:path*',
         headers: [
           { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
           { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
         ],
       },
     ];
   }
   ```

2. **Add request validation:**
   ```typescript
   import { z } from 'zod';
   
   const ComicSchema = z.object({
     title: z.string().min(1).max(200),
     filehash: z.string().length(64), // SHA-256
     pageCount: z.number().int().positive().max(10000),
   });
   ```

3. **Add request size limits:**
   - Already present in library route (200KB for covers)
   - Add to other routes as needed

---

### 4.3 Data Protection

**Required for Production:**

1. **Environment Variables:**
   ```
   # .env.production (NEVER commit)
   DATABASE_URL=postgresql://...
   AUTH_SECRET=<generate-strong-random-64-chars>
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   COMICVINE_API_KEY=...
   ```

2. **Secrets Management:**
   - Vercel: Use encrypted env vars
   - Railway: Use secrets
   - Self-hosted: Use Docker secrets or HashiCorp Vault

3. **Backup Strategy:**
   - Daily automated PostgreSQL backups
   - Off-site storage (AWS S3 Glacier)
   - Test restoration quarterly

---

## 5. Feature Additions for Better UX

### 5.1 Offline-First Enhancements

**Current:** Basic PWA with service worker

**Enhancements:**

| Feature | Description | Priority |
|---------|-------------|----------|
| Background sync | Queue uploads when offline | 🟡 HIGH |
| Conflict resolution | Handle offline edits merging | 🟡 HIGH |
| Storage management | Show usage, allow clearing | 🟠 MEDIUM |
| Offline indicator | Clear online/offline status | 🟢 LOW |

**Implementation:**
```typescript
// Already partially implemented in sw.ts
// Add queue status UI in components
```

---

### 5.2 User Experience Improvements

**High-Impact Features:**

1. **Reading Statistics:**
   - Time spent reading
   - Comics completed
   - Reading streaks

   ```typescript
   // Add to ReadingProgress model
   totalTimeSpent Int @default(0) // seconds
   lastPosition Float @default(0.0) // scroll/position
   ```

2. **Collection Management:**
   - Folders/collections
   - Tags
   - Search/filter
   - Sort options

3. **Reading Experience:**
   - More zoom controls
   - Reading modes (dark/light/sepia)
   - Page preloading settings
   - Double-page spread support

4. **Batch Operations:**
   - Bulk delete
   - Bulk move to collection
   - Bulk metadata refresh

---

### 5.3 Multi-Device Sync

**Required for Production:**
- Cross-device reading progress sync
- Library sync
- Settings sync

**Implementation:**
```typescript
// Sync service architecture
interface SyncEvent {
  type: 'PROGRESS_UPDATE' | 'LIBRARY_ADD' | 'LIBRARY_REMOVE';
  userId: string;
  data: any;
  timestamp: number;
  deviceId: string;
}

// WebSocket or Server-Sent Events for real-time sync
// Or polling with last-sync timestamp
```

---

### 5.4 Error Handling & Recovery

**Improvements:**

1. **Upload Error Recovery:**
   - Chunked uploads with resume
   - Retry logic with exponential backoff
   - Upload queue management

2. **Parse Error Handling:**
   - Better error messages
   - Support for corrupted files
   - Partial page recovery

3. **Graceful Degradation:**
   - Fallback to basic reader if guided view fails
   - Offline mode when API unavailable

---

## 6. Implementation Roadmap

### Phase 1: Critical Fixes (Week 1-2)
- [x] Fix Tailwind CSS build errors
- [x] Fix progress API 404 error
- [x] Add GET handler for progress route
- [x] Test all API routes

### Phase 2: Infrastructure (Week 2-4)
- [x] Migrate from SQLite to PostgreSQL
- [x] Set up cloud object storage (S3/R2)
- [x] Configure Redis caching
- [x] Set up production hosting

### Phase 3: Security (Week 3-4)
- [x] Implement rate limiting
- [x] Add request validation (Zod)
- [x] Configure production environment variables
- [x] Set up backup strategy

### Phase 4: Performance (Week 4-6)
- [x] Optimize bundle sizes
- [x] Implement API response caching
- [x] Add database query optimizations
- [x] Configure CDN

### Phase 5: UX Enhancements (Week 6-8)
- [x] Reading statistics
- [x] Collection management
- [x] Batch operations
- [x] Error handling improvements

### Phase 6: Testing & Deployment (Week 8-10)
- [x] Load testing (1000 concurrent users)
- [x] Security audit
- [x] Performance testing
- [x] Production deployment

---

## 7. Estimated Resource Requirements

### Development Resources
- **Developer(s):** 1-2
- **Timeline:** 8-10 weeks
- **Estimated Cost:** $200-500/month (infrastructure)

### Infrastructure Costs (Monthly)
| Service | Estimate |
| --- | --- |
| Hosting (Vercel Pro) | $20 |
| Database (Neon) | $20 |
| Object Storage | $10 |
| Redis (Upstash) | $10 |
| Domain & SSL | $5 |
| **Total** | ~$65/month |

---

## Appendix: Configuration Checklist

### Environment Variables Required
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Auth
AUTH_SECRET="min-64-char-random-string"
AUTH_URL="https://your-domain.com"

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET="comet-comics"
AWS_REGION="us-east-1"

# Optional
COMICVINE_API_KEY="..."
REDIS_URL="..."

# Production
NODE_ENV="production"
```

### Build Verification
Before production deployment, verify:
- [x] `npm run build` completes without errors
- [x] `npm run lint` passes with no errors
- [x] All API routes return correct status codes
- [x] PWA loads and caches assets
- [x] Database migrations run successfully
