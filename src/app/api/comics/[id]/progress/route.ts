/**
 * @file API route for reading progress.
 * - GET /api/comics/[id]/progress — Fetches reading progress for a comic
 * - PUT /api/comics/[id]/progress — Updates reading progress for a comic
 *
 * Requires: Valid Auth.js session + ownership of the comic
 */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import type { UpdateProgressPayload } from '@/types';

/**
 * GET /api/comics/[id]/progress — Fetches reading progress for a comic
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: comicId } = await params;

  try {
    // Verify ownership through the comic
    const comic = await db.comic.findUnique({
      where: { id: comicId },
      include: { progress: true },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    if (comic.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(comic.progress, { status: 200 });
  } catch (err: unknown) {
    console.error(`[API GET /comics/${comicId}/progress] ERROR:`, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/comics/[id]/progress — Updates reading progress for a comic.
 * Upserts the ReadingProgress record (creates on first read, updates thereafter).
 * Called from the reader on every page turn, debounced 2s client-side.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: comicId } = await params;
  const body = (await req.json()) as UpdateProgressPayload;

  if (typeof body.lastPage !== 'number' || typeof body.totalPages !== 'number') {
    return NextResponse.json(
      { error: 'Missing required fields: lastPage, totalPages' },
      { status: 400 },
    );
  }

  try {
    // Verify ownership before updating
    const comic = await db.comic.findUnique({
      where: { id: comicId },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    if (comic.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Determine read status automatically if not provided
    const readStatus =
      body.readStatus ??
      (body.lastPage === 0
        ? 'UNREAD'
        : body.lastPage >= body.totalPages - 1
          ? 'COMPLETED'
          : 'READING');

    // Run both operations in a transaction
    const [progress] = await db.$transaction([
      db.readingProgress.upsert({
        where: { comicId },
        update: {
          lastPage: body.lastPage,
          totalPages: body.totalPages,
          zoomLevel: body.zoomLevel ?? 1.0,
          readStatus,
        },
        create: {
          userId: session.user.id,
          comicId,
          lastPage: body.lastPage,
          totalPages: body.totalPages,
          zoomLevel: body.zoomLevel ?? 1.0,
          readStatus,
        },
      }),
      db.comic.update({
        where: { id: comicId },
        data: { lastReadAt: new Date() },
      })
    ]);

    return NextResponse.json(progress, { status: 200 });
  } catch (err: unknown) {
    console.error(`[API PUT /comics/${comicId}/progress] ERROR:`, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/comics/[id]/progress — Resets reading progress for a comic
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: comicId } = await params;

  try {
    // Verify ownership
    const comic = await db.comic.findUnique({
      where: { id: comicId },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    if (comic.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the progress and reset lastReadAt
    await db.$transaction([
      db.readingProgress.delete({
        where: { comicId },
      }),
      db.comic.update({
        where: { id: comicId },
        data: { lastReadAt: null },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    // Ignore if progress doesn't exist
    if (err instanceof Error && err.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ success: true }, { status: 200 });
    }
    console.error(`[API DELETE /comics/${comicId}/progress] ERROR:`, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
