import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, params, session) => {
  try {
    const userId = session.user.id;

    const [user, progressStats, completedCount] = await db.$transaction([
      db.user.findUnique({
        where: { id: userId },
        select: { readingStreak: true, lastReadDate: true },
      }),
      db.readingProgress.aggregate({
        where: { userId },
        _sum: {
          lastPage: true,
          totalTimeSpent: true,
        },
      }),
      db.readingProgress.count({
        where: { userId, readStatus: 'COMPLETED' },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      streak: user.readingStreak || 0,
      pagesFlipped: progressStats._sum.lastPage || 0,
      timeSpentSeconds: progressStats._sum.totalTimeSpent || 0,
      comicsFinished: completedCount || 0,
      lastReadDate: user.lastReadDate,
    });
  } catch (err: unknown) {
    logger.error(
      '[API GET /user/stats] ERROR',
      {},
      err instanceof Error ? err : new Error(String(err)),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
