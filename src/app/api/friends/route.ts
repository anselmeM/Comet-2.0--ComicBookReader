import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/friends — Returns the authenticated user's friends list
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { friendId: session.user.id },
        ],
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
    console.error('[API] Friends GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/friends?friendId=... — Removes a friend
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get('friendId');

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
    console.error('[API] Friends DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
