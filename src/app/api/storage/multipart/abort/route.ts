import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { abortMultipartUpload } from '@/lib/storage';
import { logger } from '@/lib/logger';

/**
 * POST /api/storage/multipart/abort — Aborts a multipart upload,
 * discarding any uploaded parts, and marks the comic as ERROR.
 */
export async function POST(req: Request) {
  let comicId: string | undefined;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    comicId = body.comicId;
    const { uploadId } = body;

    if (!comicId || !uploadId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const comic = await db.comic.findFirst({
      where: { id: comicId, userId: session.user.id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    if (comic.storageKey) {
      try {
        await abortMultipartUpload(comic.storageKey, uploadId);
      } catch (s3Error) {
        logger.warn('Failed to abort multipart upload in storage', { comicId }, s3Error as Error);
      }
    }

    await db.comic.update({
      where: { id: comicId },
      data: { syncStatus: 'ERROR' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Multipart abort error', { comicId }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
