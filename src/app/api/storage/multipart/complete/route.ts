import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { completeMultipartUpload } from '@/lib/storage';
import { logger } from '@/lib/logger';

/**
 * POST /api/storage/multipart/complete — Completes a multipart upload
 * using the ETags of every uploaded part, then marks the comic as SYNCED.
 */
export async function POST(req: Request) {
  let comicId: string | undefined;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    comicId = body.comicId;
    const { uploadId, parts } = body;

    if (!comicId || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const comic = await db.comic.findFirst({
      where: { id: comicId, userId: session.user.id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    const normalizedParts = parts
      .filter((p): p is { PartNumber: number; ETag: string } => p && typeof p.PartNumber === 'number' && typeof p.ETag === 'string')
      .sort((a, b) => a.PartNumber - b.PartNumber);

    if (normalizedParts.length !== parts.length) {
      return NextResponse.json({ error: 'Invalid parts list' }, { status: 400 });
    }

    await completeMultipartUpload(comic.storageKey as string, uploadId, normalizedParts);

    await db.comic.update({
      where: { id: comicId },
      data: { syncStatus: 'SYNCED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Multipart complete error', { comicId }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
