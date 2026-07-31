import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { s3, BUCKET_NAME, verifyStorageConfig } from '@/lib/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/lib/logger';

/**
 * POST /api/storage/upload — Generates a pre-signed URL for comic upload.
 * Requires: PREMIUM plan.
 */
export async function POST(req: Request) {
  let comicId: string | undefined;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    // 1. Verify PREMIUM plan
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (user?.plan !== 'PREMIUM') {
      return NextResponse.json(
        { error: 'Upgrade to Premium to enable Cloud Sync' },
        { status: 403 },
      );
    }

    const body = await req.json();
    comicId = body.comicId;
    const { contentType, fileName } = body;

    if (!comicId || !contentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Verify comic ownership
    const comic = await db.comic.findFirst({
      where: { id: comicId, userId: session.user.id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    // 3. Generate storage key: user-id/comic-id/filename
    const key = `${session.user.id}/${comicId}/${fileName || 'comic.cbz'}`;

    // 4. Generate PUT URL (with local mock fallback if S3 is not configured in dev)
    let url = '';
    const isDev = process.env.NODE_ENV === 'development';
    const isS3Configured = verifyStorageConfig(false);

    if (isDev && !isS3Configured) {
      url = `http://localhost:3101/api/storage/mock-s3?key=${encodeURIComponent(key)}`;
    } else if (!isS3Configured) {
      return NextResponse.json(
        { error: 'Cloud Sync is not configured for this environment' },
        { status: 503 },
      );
    } else {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });
      url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    }

    // 5. Update comic status to PENDING
    await db.comic.update({
      where: { id: comicId },
      data: {
        storageKey: key,
        syncStatus: 'PENDING',
      },
    });

    return NextResponse.json({ url, key });
  } catch (error) {
    logger.error('Storage upload error', { comicId }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/storage/upload — Marks an upload as completed.
 */
export async function PATCH(req: Request) {
  let comicId: string | undefined;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    comicId = body.comicId;
    const { status } = body; // status: 'SYNCED' or 'ERROR'

    if (!comicId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.comic.update({
      where: { id: comicId, userId: session.user.id },
      data: { syncStatus: status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Storage upload patch error', { comicId }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
