import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { invalidateCache } from '@/lib/cache';

/**
 * DELETE /api/comics/progress — Clears reading progress for all comics (clears history)
 */
export const DELETE = withAuth(async (req: Request, params, session) => {
  try {
    const userId = session.user.id;

    // Run database deletes and updates in transaction
    await db.$transaction([
      db.readingProgress.deleteMany({
        where: { userId },
      }),
      db.comic.updateMany({
        where: { userId },
        data: { lastReadAt: null },
      }),
    ]);

    // Invalidate library cache for the user
    await invalidateCache(`comet:u:${userId}:library`, true);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    logger.error('[API DELETE /api/comics/progress] ERROR', {}, err as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
