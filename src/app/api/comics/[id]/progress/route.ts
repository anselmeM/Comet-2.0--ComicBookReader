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

  // Verify ownership before updating
  const comic = await db.comic.findFirst({
    where: { id: comicId, userId: session.user.id },
  });
  if (!comic) {
    return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
  }

  // Determine read status automatically if not provided
  const readStatus =
    body.readStatus ??
    (body.lastPage === 0
      ? 'UNREAD'
      : body.lastPage >= body.totalPages - 1
        ? 'COMPLETED'
        : 'READING');

  const progress = await db.readingProgress.upsert({
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
  });

  // Update lastReadAt on the comic itself
  await db.comic.update({
    where: { id: comicId },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json(progress, { status: 200 });
}
