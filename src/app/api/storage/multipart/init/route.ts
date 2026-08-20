import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { createMultipartUpload, verifyStorageConfig } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { COMIC_CONFIG } from '@/lib/constants';

/**
 * POST /api/storage/multipart/init — Initiates a multipart upload and
 * returns presigned URLs for each part. Used for large comic files where
 * a single PUT to R2 intermittently resets over HTTP/2.
 */
export async function POST(req: Request) {
  let comicId: string | undefined;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    comicId = body.comicId;
    const { fileName, contentType, fileSize } = body;

    if (!comicId || !fileSize || fileSize <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hard size cap (was only enforced on the old buffered upload route)
    if (fileSize > COMIC_CONFIG.MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const comic = await db.comic.findFirst({
      where: { id: comicId, userId: session.user.id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    const key = `${session.user.id}/${comicId}/${fileName || 'comic.cbz'}`;

    const isDev = process.env.NODE_ENV === 'development';
    const isS3Configured = verifyStorageConfig(false);

    if (isDev && !isS3Configured) {
      const partSize = 10 * 1024 * 1024;
      const partCount = Math.ceil(fileSize / partSize) || 1;
      const partUrls = Array.from(
        { length: partCount },
        (_, i) =>
          `http://localhost:3101/api/storage/mock-s3?key=${encodeURIComponent(key)}&part=${i + 1}`,
      );

      await db.comic.update({
        where: { id: comicId },
        data: {
          storageKey: key,
          syncStatus: 'PENDING',
        },
      });

      return NextResponse.json({
        uploadId: `mock-upload-${Date.now()}`,
        key,
        partSize,
        partCount,
        partUrls,
      });
    }

    if (!isS3Configured) {
      return NextResponse.json(
        { error: 'Cloud Sync is not configured for this environment' },
        { status: 503 },
      );
    }

    const { uploadId, partUrls, partSize, partCount } = await createMultipartUpload(
      key,
      contentType || 'application/octet-stream',
      fileSize,
    );

    await db.comic.update({
      where: { id: comicId },
      data: {
        storageKey: key,
        syncStatus: 'PENDING',
      },
    });

    return NextResponse.json({ uploadId, key, partSize, partCount, partUrls });
  } catch (error) {
    logger.error('Multipart init error', { comicId }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
