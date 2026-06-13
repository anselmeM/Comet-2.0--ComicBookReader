import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/bookmarks?comicId=... — Returns all bookmarks for a specific comic.
 */
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const comicId = searchParams.get('comicId');

    if (!comicId) {
      return NextResponse.json({ error: 'Comic ID is required' }, { status: 400 });
    }

    // Verify comic ownership
    const comic = await db.comic.findUnique({
      where: {
        id: comicId,
        userId: session.user.id,
      },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found or access denied' }, { status: 404 });
    }

    const bookmarks = await db.bookmark.findMany({
      where: {
        userId: session.user.id,
        comicId,
      },
      orderBy: {
        pageNumber: 'asc',
      },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    logger.error('[API] Bookmark GET error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
});

/**
 * POST /api/bookmarks — Creates or updates a bookmark for a specific page.
 */
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json();
    const { comicId, pageNumber, label } = body;

    if (!comicId || pageNumber === undefined) {
      return NextResponse.json({ error: 'Comic ID and page number are required' }, { status: 400 });
    }

    // Verify comic ownership
    const comic = await db.comic.findUnique({
      where: {
        id: comicId,
        userId: session.user.id,
      },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found or access denied' }, { status: 404 });
    }

    // Ensure ReadingProgress exists (required by Bookmark relation in schema)
    let progress = await db.readingProgress.findUnique({
      where: { comicId },
    });

    if (!progress) {
      progress = await db.readingProgress.create({
        data: {
          userId: session.user.id,
          comicId,
          totalPages: comic.pageCount,
        },
      });
    }

    // Create or update bookmark
    const bookmark = await db.bookmark.upsert({
      where: {
        userId_comicId_pageNumber: {
          userId: session.user.id,
          comicId,
          pageNumber,
        },
      },
      update: {
        label: label || null,
      },
      create: {
        userId: session.user.id,
        comicId,
        pageNumber,
        label: label || null,
      },
    });

    return NextResponse.json({ bookmark });
  } catch (error) {
    logger.error('[API] Bookmark POST error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
});

/**
 * PUT /api/bookmarks — Updates a bookmark label by ID.
 */
export const PUT = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json();
    const { id, label } = body;

    if (!id) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    const bookmark = await db.bookmark.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        label: label || null,
      },
    });

    return NextResponse.json({ bookmark });
  } catch (error) {
    logger.error('[API] Bookmark PUT error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
  }
});

/**
 * DELETE /api/bookmarks?id=... — Deletes a bookmark by ID.
 */
export const DELETE = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    await db.bookmark.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[API] Bookmark DELETE error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
});
