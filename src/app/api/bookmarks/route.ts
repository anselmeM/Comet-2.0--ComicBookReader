import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/bookmarks?comicId=... — Returns all bookmarks for a specific comic.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const comicId = searchParams.get('comicId');

    if (!comicId) {
      return NextResponse.json({ error: 'Comic ID is required' }, { status: 400 });
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
    console.error('[API] Bookmark GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

/**
 * POST /api/bookmarks — Creates or updates a bookmark for a specific page.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { comicId, pageNumber, label } = body;

    if (!comicId || pageNumber === undefined) {
      return NextResponse.json({ error: 'Comic ID and page number are required' }, { status: 400 });
    }

    // Ensure ReadingProgress exists (required by Bookmark relation in schema)
    let progress = await db.readingProgress.findUnique({
      where: { comicId },
    });

    if (!progress) {
      // Find the comic to get totalPages
      const comic = await db.comic.findUnique({ where: { id: comicId } });
      
      progress = await db.readingProgress.create({
        data: {
          userId: session.user.id,
          comicId,
          totalPages: comic?.pageCount || 0,
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
    console.error('[API] Bookmark POST error:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}

/**
 * PUT /api/bookmarks — Updates a bookmark label by ID.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error('[API] Bookmark PUT error:', error);
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
  }
}

/**
 * DELETE /api/bookmarks?id=... — Deletes a bookmark by ID.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error('[API] Bookmark DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
