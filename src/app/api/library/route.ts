/**
 * @file GET /api/library — Returns the authenticated user's comic library
 *       POST /api/library — Adds a new comic to the library
 *
 * Requires: Valid Auth.js session
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { getCache, setCache, invalidateCache, genCacheKey } from '@/lib/cache';
import { Prisma } from '@prisma/client';
import { PaginatedLibraryResponseDTO } from '@/types/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { parseComicFilename } from '@/lib/metadata-parser';
import { createNotification } from '@/lib/notifications';

/**
 * GET /api/library — Returns the authenticated user's comic library
 */
export const GET = withAuth(async (_req: Request, context, session) => {
  try {
    // Rate limit check
    const ip = (_req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
    const limiter = await rateLimit(`library_get_${ip}`, 100, 60 * 1000); // 100 per minute
    if (limiter.isLimited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: limiter.headers },
      );
    }

    // Parse parameters from URL
    const { searchParams } = new URL(_req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const series = searchParams.get('series') || '';
    const sortBy = searchParams.get('sortBy') || 'recent';
    const yearStart = searchParams.get('yearStart')
      ? parseInt(searchParams.get('yearStart')!)
      : null;
    const yearEnd = searchParams.get('yearEnd') ? parseInt(searchParams.get('yearEnd')!) : null;
    const readStatus = searchParams.get('readStatus') || 'all'; // all, unread, reading, completed
    const includeIds = searchParams.get('includeIds')
      ? searchParams.get('includeIds')!.split(',')
      : null;

    // Check Cache (T-INF-004)
    const cacheKey = genCacheKey(session.user.id, 'library', {
      page,
      limit,
      search,
      series,
      sortBy,
      yearStart,
      yearEnd,
      readStatus,
      includeIds: includeIds ? includeIds.join(',') : null,
    });
    const cachedData = await getCache<PaginatedLibraryResponseDTO>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        status: 200,
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ComicWhereInput = { userId: session.user.id };

    if (includeIds) {
      where.id = { in: includeIds };
    }

    if (search) {
      const isPostgres = process.env.DATABASE_URL?.startsWith('postgres') || false;
      where.OR = [
        {
          title: (isPostgres
            ? { contains: search, mode: 'insensitive' }
            : { contains: search }) as any,
        },
        {
          series: (isPostgres
            ? { contains: search, mode: 'insensitive' }
            : { contains: search }) as any,
        },
      ];
    }

    if (series) {
      where.series = series;
    }

    if (yearStart !== null || yearEnd !== null) {
      where.year = {};
      if (yearStart !== null) where.year.gte = yearStart;
      if (yearEnd !== null) where.year.lte = yearEnd;
    }

    if (readStatus !== 'all') {
      if (readStatus === 'unread') {
        where.progress = { is: null };
      } else if (readStatus === 'reading') {
        where.progress = { readStatus: 'READING' };
      } else if (readStatus === 'completed') {
        where.progress = { readStatus: 'COMPLETED' };
      }
    }

    // Build order clause
    let orderBy: Prisma.ComicOrderByWithRelationInput = { lastReadAt: 'desc' };
    if (sortBy === 'title_asc') orderBy = { title: 'asc' };
    if (sortBy === 'title_desc') orderBy = { title: 'desc' };
    if (sortBy === 'added') orderBy = { addedAt: 'desc' };
    if (sortBy === 'year_desc') orderBy = { year: 'desc' };
    if (sortBy === 'year_asc') orderBy = { year: 'asc' };
    if (sortBy === 'pages_desc') orderBy = { pageCount: 'desc' };
    if (sortBy === 'pages_asc') orderBy = { pageCount: 'asc' };
    if (sortBy === 'rating_desc') orderBy = { rating: 'desc' };
    if (sortBy === 'rating_asc') orderBy = { rating: 'asc' };

    // Get total count for pagination info
    const total = await db.comic.count({ where });

    const comics = await db.comic.findMany({
      where,
      include: { progress: true },
      orderBy,
      take: limit,
      skip: skip,
    });

    const mappedComics = comics.map((c) => {
      if (!c.series) {
        const parsed = parseComicFilename(c.title);
        return {
          ...c,
          series: parsed.series,
          issue: c.issue ?? parsed.issue,
          year: c.year ?? parsed.year,
        };
      }
      return c;
    });

    const response: PaginatedLibraryResponseDTO = {
      data: mappedComics as any, // Cast required as Prisma generated type slightly differs from DTO
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Store in Cache for 5 minutes (T-INF-004)
    await setCache(cacheKey, response, 5 * 60);

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error) {
    logger.error('Library GET error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

/**
 * POST /api/library — Adds a new comic to the library
 */
export const POST = withAuth(async (_req: Request, context, session) => {
  try {
    // Rate limit check
    const ip = (_req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
    const limiter = await rateLimit(`library_post_${ip}`, 10, 60 * 1000); // 10 per minute
    if (limiter.isLimited) {
      return NextResponse.json(
        {
          error: 'Too many upload attempts. Please try again in a minute.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429, headers: limiter.headers },
      );
    }

    const contentType = _req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    // Invalidate library cache for this user (T-INF-004)
    await invalidateCache(`comet:u:${session.user.id}:library`, true);

    const body = await _req.json();
    const { title, filehash, pageCount, coverUrl } = body;

    if (!title || !filehash || !pageCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if comic already exists for this user (filehash deduplication)
    const existing = await db.comic.findUnique({
      where: {
        userId_filehash: {
          userId: session.user.id,
          filehash,
        },
      },
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const parsedMeta = parseComicFilename(title);

    // Create the comic record
    const comic = await db.comic.create({
      data: {
        title,
        filehash,
        pageCount,
        coverUrl,
        series: parsedMeta.series,
        issue: parsedMeta.issue,
        year: parsedMeta.year,
        userId: session.user.id,
      },
    });

    // Trigger notification for newly added comic
    await createNotification({
      userId: session.user.id,
      type: 'NEW_CONTENT',
      title: 'Comic Added',
      message: `"${title}" has been successfully added to your library.`,
      link: '/library',
    });

    return NextResponse.json(comic, { status: 201 });
  } catch (err) {
    logger.error('Library POST error', {}, err as Error);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
