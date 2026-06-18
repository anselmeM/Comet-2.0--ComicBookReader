import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/user/reading-sessions — Fetch recent logs and graph data
 */
export const GET = withAuth(async (req: Request, params, session) => {
  try {
    const userId = session.user.id;

    // 1. Fetch recent individual sessions (last 50)
    const recentSessions = await db.readingSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        comic: {
          select: {
            title: true,
            coverUrl: true,
            series: true,
          },
        },
      },
    });

    // 2. Fetch all sessions in the last 180 days for heatmap & bar chart
    const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const sessionsInPeriod = await db.readingSession.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, pagesRead: true },
    });

    // 3. Process Heatmap Data: { "YYYY-MM-DD": pagesRead }
    const heatmap: { [date: string]: number } = {};
    sessionsInPeriod.forEach((s) => {
      const dateStr = s.createdAt.toISOString().split('T')[0];
      heatmap[dateStr] = (heatmap[dateStr] || 0) + s.pagesRead;
    });

    // 4. Process Weekly Data: Last 8 weeks
    const weekly: { weekLabel: string; count: number }[] = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      // Set to start of the week day
      const dayDiff = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayDiff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      let count = 0;
      sessionsInPeriod.forEach((s) => {
        if (s.createdAt >= weekStart && s.createdAt < weekEnd) {
          count += s.pagesRead;
        }
      });

      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weekly.push({ weekLabel: label, count });
    }

    return NextResponse.json(
      {
        sessions: recentSessions,
        heatmap,
        weekly,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    logger.error(
      '[API GET /user/reading-sessions] ERROR',
      {},
      err instanceof Error ? err : new Error(String(err)),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

/**
 * DELETE /api/user/reading-sessions — Clear reading session log(s)
 */
export const DELETE = withAuth(async (req: Request, params, session) => {
  try {
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');

    if (sessionId) {
      // Delete specific session
      const sessionRecord = await db.readingSession.findUnique({
        where: { id: sessionId },
      });

      if (!sessionRecord || sessionRecord.userId !== userId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      await db.readingSession.delete({
        where: { id: sessionId },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      // Clear all history
      await db.readingSession.deleteMany({
        where: { userId },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (err: unknown) {
    logger.error(
      '[API DELETE /user/reading-sessions] ERROR',
      {},
      err instanceof Error ? err : new Error(String(err)),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
