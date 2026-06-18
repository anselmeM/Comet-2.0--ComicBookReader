import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/comics/[id]/comments — Fetch comments for this issue from self and friends
 */
export const GET = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id: comicId } = await params;
    const userId = session.user.id;

    try {
      // 1. Fetch current comic info
      const comic = await db.comic.findUnique({
        where: { id: comicId },
        select: { series: true, issue: true, comicVineId: true, userId: true },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      // Check ownership/permissions
      if (comic.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 2. Fetch user's friends list
      const friendships = await db.friendship.findMany({
        where: {
          OR: [{ userId }, { friendId: userId }],
        },
        select: { userId: true, friendId: true },
      });

      const friendIds = friendships.map((f) => (f.userId === userId ? f.friendId : f.userId));
      const allowedUserIds = [userId, ...friendIds];

      // 3. Construct matching filter for the same issue/volume
      const matchConditions: any[] = [];
      if (comic.comicVineId) {
        matchConditions.push({ comic: { comicVineId: comic.comicVineId } });
      }
      if (comic.series && comic.issue !== null) {
        matchConditions.push({
          comic: {
            series: comic.series,
            issue: comic.issue,
          },
        });
      }

      if (matchConditions.length === 0) {
        // Fallback to exact comic match if metadata is completely missing
        matchConditions.push({ comicId });
      }

      // 4. Fetch comments matching the issue from allowed authors
      const comments = await db.comicComment.findMany({
        where: {
          OR: matchConditions,
          userId: { in: allowedUserIds },
        },
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json({ comments }, { status: 200 });
    } catch (err: unknown) {
      logger.error(`[API GET /comics/${comicId}/comments] ERROR`, {}, err as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);

/**
 * POST /api/comics/[id]/comments — Post a new message/comment for this issue
 */
export const POST = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id: comicId } = await params;
    const userId = session.user.id;

    try {
      const json = await req.json();
      const { message } = json;

      if (!message || !message.trim()) {
        return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
      }

      // 1. Verify user owns the comic
      const comic = await db.comic.findUnique({
        where: { id: comicId },
        select: { userId: true },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      if (comic.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 2. Create the comment
      const newComment = await db.comicComment.create({
        data: {
          comicId,
          userId,
          message: message.trim(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json({ comment: newComment }, { status: 201 });
    } catch (err: unknown) {
      logger.error(`[API POST /comics/${comicId}/comments] ERROR`, {}, err as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);
