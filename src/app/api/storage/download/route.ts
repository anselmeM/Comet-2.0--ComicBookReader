import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { s3, BUCKET_NAME } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * GET /api/storage/download?comicId=... — Generates a pre-signed URL for comic download.
 * Requires: PREMIUM plan.
 */
export async function GET(req: Request) {
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

    // 1. Verify PREMIUM plan
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (user?.plan !== 'PREMIUM') {
      return NextResponse.json({ error: 'Upgrade to Premium to enable Cloud Sync' }, { status: 403 });
    }

    // 2. Verify comic ownership and get storage key
    const comic = await db.comic.findFirst({
      where: { id: comicId, userId: session.user.id },
      select: { storageKey: true },
    });

    if (!comic || !comic.storageKey) {
      return NextResponse.json({ error: 'Comic not found or not synced to cloud' }, { status: 404 });
    }

    // 3. Generate pre-signed GET URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: comic.storageKey,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[STORAGE_DOWNLOAD_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
