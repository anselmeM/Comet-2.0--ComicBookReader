import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/friends — Returns the authenticated user's friends list
 */
export const GET = withAuth(async (req: Request, context, session) => {
  try {
    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ userId: session.user.id }, { friendId: session.user.id }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const friends = friendships.map((f) => {
      const isUser = f.userId === session.user.id;
      const friendData = isUser ? f.friend : f.user;
      return {
        id: f.id,
        friendId: friendData.id,
        name: friendData.name,
        image: friendData.image,
        email: friendData.email,
        createdAt: f.createdAt,
      };
    });

    return NextResponse.json({ friends });
  } catch (error) {
    logger.error('Friends GET error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

/**
 * DELETE /api/friends?friendId=... — Removes a friend
 */
export const DELETE = withAuth(async (req: Request, context, session) => {
  let friendId: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    friendId = searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    await db.friendship.deleteMany({
      where: {
        OR: [
          { userId: session.user.id, friendId },
          { userId: friendId, friendId: session.user.id },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Friends DELETE error', { friendId: friendId || undefined }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
