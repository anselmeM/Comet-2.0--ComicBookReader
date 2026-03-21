'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbType = any;

// Simple type guard to check if bookmark model exists
function hasBookmarkModel(db: DbType): db is { bookmark: DbType } {
  return db && typeof db === 'object' && 'bookmark' in db;
}

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

    // Check if bookmark model is available in Prisma client
    if (!hasBookmarkModel(db)) {
      console.warn('Bookmark model not available in Prisma client');
      return NextResponse.json({ bookmarks: [], warning: 'Database model not available' });
    }

    // First ensure ReadingProgress exists for this comic
    let progress = await db.readingProgress.findUnique({
      where: { comicId },
    });

    if (!progress) {
      // Create ReadingProgress if it doesn't exist
      progress = await db.readingProgress.create({
        data: {
          userId: session.user.id,
          comicId,
          totalPages: 0,
        },
      });
    }

    // Get bookmarks for this comic
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
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ bookmarks: [], error: 'Using local storage' }, { status: 200 });
  }
}

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

    // Check if bookmark model is available
    if (!hasBookmarkModel(db)) {
      console.warn('Bookmark model not available in Prisma client');
      return NextResponse.json({ error: 'Database model not available' }, { status: 503 });
    }

    // First ensure ReadingProgress exists for this comic
    let progress = await db.readingProgress.findUnique({
      where: { comicId },
    });

    if (!progress) {
      // Create ReadingProgress if it doesn't exist
      progress = await db.readingProgress.create({
        data: {
          userId: session.user.id,
          comicId,
          totalPages: 0,
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
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if bookmark model is available
    if (!hasBookmarkModel(db)) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 503 });
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
    console.error('Error updating bookmark:', error);
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if bookmark model is available
    if (!hasBookmarkModel(db)) {
      return NextResponse.json({ error: 'Database model not available' }, { status: 503 });
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
    console.error('Error deleting bookmark:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
