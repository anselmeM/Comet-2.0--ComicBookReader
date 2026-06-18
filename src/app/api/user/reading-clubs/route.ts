import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/user/reading-clubs — Fetch shared reading queues (clubs)
 */
export const GET = withAuth(async (req: Request, params, session) => {
  try {
    const userId = session.user.id;

    // 1. Fetch user's friends list
    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
      },
      select: { userId: true, friendId: true },
    });

    const friendIds = friendships.map((f) => (f.userId === userId ? f.friendId : f.userId));
    const allowedUserIds = [userId, ...friendIds];

    // 2. Fetch active reading progress records for user and friends
    const activeProgress = await db.readingProgress.findMany({
      where: {
        userId: { in: allowedUserIds },
        readStatus: 'READING',
        lastPage: { gt: 0 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        comic: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            series: true,
            issue: true,
            comicVineId: true,
          },
        },
      },
    });

    // 3. Group by issue details
    const clubsMap = new Map<
      string,
      {
        key: string;
        title: string;
        coverUrl: string | null;
        series: string | null;
        issue: number | null;
        comicVineId: string | null;
        userProgress: { lastPage: number; totalPages: number; percent: number } | null;
        activeReaders: {
          userId: string;
          userName: string;
          userImage: string | null;
          lastPage: number;
          totalPages: number;
          percent: number;
        }[];
      }
    >();

    activeProgress.forEach((p) => {
      // Ignore unstructured comics for clubs
      if (!p.comic.series || p.comic.issue === null) return;

      const key = p.comic.comicVineId || `${p.comic.series.toLowerCase()}-${p.comic.issue}`;
      const percent = Math.round((p.lastPage / p.totalPages) * 100);

      if (!clubsMap.has(key)) {
        clubsMap.set(key, {
          key,
          title: p.comic.title,
          coverUrl: p.comic.coverUrl,
          series: p.comic.series,
          issue: p.comic.issue,
          comicVineId: p.comic.comicVineId,
          userProgress: null,
          activeReaders: [],
        });
      }

      const club = clubsMap.get(key)!;

      if (p.userId === userId) {
        club.userProgress = {
          lastPage: p.lastPage,
          totalPages: p.totalPages,
          percent,
        };
      } else {
        club.activeReaders.push({
          userId: p.userId,
          userName: p.user.name || 'Anonymous',
          userImage: p.user.image,
          lastPage: p.lastPage,
          totalPages: p.totalPages,
          percent,
        });
      }
    });

    // 4. Fetch user's comics to resolve userComicId for each club
    const userComics = await db.comic.findMany({
      where: { userId },
      select: {
        id: true,
        series: true,
        issue: true,
        comicVineId: true,
      },
    });

    // Filter to only return issues where at least one friend is reading and map userComicId
    const clubs = Array.from(clubsMap.values())
      .filter((c) => c.activeReaders.length > 0)
      .map((c) => {
        const matchingComic = userComics.find((uc) => {
          if (c.comicVineId && uc.comicVineId === c.comicVineId) return true;
          return (
            c.series &&
            uc.series &&
            c.series.toLowerCase() === uc.series.toLowerCase() &&
            c.issue === uc.issue
          );
        });

        return {
          ...c,
          userComicId: matchingComic ? matchingComic.id : null,
        };
      });

    return NextResponse.json({ clubs }, { status: 200 });
  } catch (err: unknown) {
    logger.error('[API GET /api/user/reading-clubs] ERROR', {}, err as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
