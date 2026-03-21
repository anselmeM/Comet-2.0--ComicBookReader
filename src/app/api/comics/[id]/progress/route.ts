/**
 * @file PUT /api/comics/[id]/progress — Updates reading progress for a comic.
 *
 * Upserts the ReadingProgress record (creates on first read, updates thereafter).
 * Called from the reader on every page turn, debounced 2s client-side.
 *
 * Requires: Valid Auth.js session + ownership of the comic
 */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import type { UpdateProgressPayload } from '@/types';

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
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
