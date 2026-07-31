import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { s3, BUCKET_NAME, verifyStorageConfig } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/lib/logger';

/**
 * GET /api/storage/download?comicId=... — Generates a pre-signed URL for comic download.
 * Available to all authenticated users so their comics restore across devices.
 */
export async function GET(req: Request) {
  let comicId: string | null = null;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    comicId = searchParams.get('comicId');

    if (!comicId) {
      return NextResponse.json({ error: 'Comic ID is required' }, { status: 400 });
    }

    // 1. Verify comic ownership and get storage key
    const comic = await db.comic.findFirst({
      where: { id: comicId, userId: session.user.id },
      select: { storageKey: true },
    });

    if (!comic || !comic.storageKey) {
      return NextResponse.json(
        { error: 'Comic not found or not synced to cloud' },
        { status: 404 },
      );
    }

    // 3. Generate GET URL (with local mock fallback if S3 is not configured in dev)
    let url = '';
    const isDev = process.env.NODE_ENV === 'development';
    const isS3Configured = verifyStorageConfig(false);

    if (isDev && !isS3Configured) {
      url = `http://localhost:3101/api/storage/mock-s3?key=${encodeURIComponent(comic.storageKey)}`;
    } else if (!isS3Configured) {
      return NextResponse.json(
        { error: 'Cloud Sync is not configured for this environment' },
        { status: 503 },
      );
    } else {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: comic.storageKey,
      });
      url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    logger.error('Storage download error', { comicId: comicId || undefined }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
