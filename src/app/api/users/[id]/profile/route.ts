import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/users/[id]/profile — Fetch public profile data for a specific user
 * This will return their badges, reading statistics, and recent activity
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const { id: targetUserId } = await params;

    // 1. Fetch user basics
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch friendship status to ensure privacy if we add privacy controls later
    // Currently, profiles are public to anyone logged in, but we can verify friendship.
    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: targetUserId },
          { userId: targetUserId, friendId: session.user.id },
        ],
      },
    });

    const isFriend = !!friendship;
    const isSelf = session.user.id === targetUserId;

    // 3. Fetch Badges
    const badges = await db.userBadge.findMany({
      where: { userId: targetUserId },
      orderBy: { earnedAt: 'desc' },
    });

    // 4. Fetch Reading Statistics
    // Total comics in library
    const libraryCount = await db.comic.count({
      where: { userId: targetUserId },
    });

    // Comics completed
    const completedCount = await db.readingProgress.count({
      where: { userId: targetUserId, readStatus: 'COMPLETED' },
    });

    // Total time spent (sum of all reading progress time)
    const readingProgresses = await db.readingProgress.findMany({
      where: { userId: targetUserId },
      select: { totalTimeSpent: true },
    });
    const totalTimeSpent = readingProgresses.reduce((acc, curr) => acc + curr.totalTimeSpent, 0);

    // 5. Fetch Recent Activity (last 5 comics read or added)
    const recentActivity = await db.readingProgress.findMany({
      where: { userId: targetUserId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        comic: {
          select: {
            title: true,
            coverUrl: true,
            series: true,
            issue: true,
          },
        },
      },
    });

    return NextResponse.json({
      profile: {
        ...targetUser,
        isFriend,
        isSelf,
        stats: {
          libraryCount,
          completedCount,
          totalTimeSpent,
        },
        badges,
        recentActivity: recentActivity.map((ra) => ({
          comicId: ra.comicId,
          title: ra.comic.title,
          coverUrl: ra.comic.coverUrl,
          series: ra.comic.series,
          issue: ra.comic.issue,
          readStatus: ra.readStatus,
          lastReadAt: ra.lastReadAt,
          percent: Math.round((ra.lastPage / ra.totalPages) * 100) || 0,
        })),
      },
    });
  } catch (error) {
    logger.error('Profile GET error', {}, error as Error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
