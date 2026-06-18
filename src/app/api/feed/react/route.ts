import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { invalidateCache } from '@/lib/cache';

/**
 * POST /api/feed/react — Toggle a reaction on a community feed activity
 */
export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse || !session?.user?.id) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { activityId, reactionType } = json;

    if (!activityId || !reactionType) {
      return NextResponse.json({ error: 'Missing activityId or reactionType' }, { status: 400 });
    }

    const validReactions = ['FIRE', 'HEART', 'LIKE', 'TROPHY'];
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // 1. Find the activity progress and verify visibility (self or friend)
    const progress = await db.readingProgress.findUnique({
      where: { id: activityId },
    });

    if (!progress) {
      return NextResponse.json({ error: 'Activity progress record not found' }, { status: 404 });
    }

    if (progress.userId !== session.user.id) {
      // Check if they are friends
      const isFriend = await db.friendship.findFirst({
        where: {
          OR: [
            { userId: session.user.id, friendId: progress.userId },
            { userId: progress.userId, friendId: session.user.id },
          ],
        },
      });

      if (!isFriend) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 2. Toggle reaction
    const existing = await db.activityReaction.findUnique({
      where: {
        readingProgressId_userId_reactionType: {
          readingProgressId: activityId,
          userId: session.user.id,
          reactionType,
        },
      },
    });

    if (existing) {
      await db.activityReaction.delete({
        where: { id: existing.id },
      });
      // Invalidate feed cache
      await invalidateCache('comet:global_feed', true);
      return NextResponse.json({ reacted: false });
    } else {
      await db.activityReaction.create({
        data: {
          readingProgressId: activityId,
          userId: session.user.id,
          reactionType,
        },
      });
      await invalidateCache('comet:global_feed', true);
      return NextResponse.json({ reacted: true });
    }
  } catch (err: unknown) {
    logger.error('[API POST /api/feed/react] ERROR', {}, err as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
