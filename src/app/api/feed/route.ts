import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCache, setCache, genCacheKey } from '@/lib/cache';

/**
 * GET /api/feed — Returns a list of recent reading activities across the community.
 * Activities include: starting a comic, finishing a comic, and milestones.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get from cache first (1 minute TTL)
    const cacheKey = 'comet:global_feed';
    const cachedFeed = await getCache<any[]>(cacheKey);
    if (cachedFeed) {
      return NextResponse.json({ activities: cachedFeed });
    }

    // Fetch user's friends to restrict feed
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { friendId: session.user.id }
        ]
      },
      select: {
        userId: true,
        friendId: true,
      }
    });

    const friendIds = friendships.map(f => f.userId === session.user.id ? f.friendId : f.userId);
    const allowedUserIds = [session.user.id, ...friendIds];

    // Fetch recent reading progress updates from the allowed user list
    const recentActivities = await db.readingProgress.findMany({
      where: {
        userId: { in: allowedUserIds },
        // Only show activities that have some progress
        lastPage: { gt: 0 },
        // Only show users who have a name (to avoid showing anonymous/bot-like entries)
        user: { name: { not: null } }
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        comic: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            series: true,
            issue: true,
          }
        }
      }
    });

    // Transform into activity objects
    const activities = recentActivities.map(progress => {
      const isCompleted = progress.readStatus === 'COMPLETED' || progress.lastPage >= progress.totalPages - 1;
      
      return {
        id: progress.id,
        userId: progress.userId,
        userName: progress.user.name,
        userImage: progress.user.image,
        comicId: progress.comicId,
        comicTitle: progress.comic.title,
        comicCover: progress.comic.coverUrl,
        series: progress.comic.series,
        issue: progress.comic.issue,
        type: isCompleted ? 'FINISHED' : 'READING',
        timestamp: progress.updatedAt,
      };
    });

    // Cache the result
    await setCache(cacheKey, activities, 60);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('[API] Feed GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
