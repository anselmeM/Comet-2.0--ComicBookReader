import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/friends/requests — Returns pending incoming and outgoing friend requests
 */
export const GET = withAuth(async (req: Request, context, session) => {
  try {
    const incoming = await db.friendRequest.findMany({
      where: {
        receiverId: session.user.id,
        status: 'PENDING',
      },
      include: {
        sender: {
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

    const outgoing = await db.friendRequest.findMany({
      where: {
        senderId: session.user.id,
        status: 'PENDING',
      },
      include: {
        receiver: {
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

    return NextResponse.json({ incoming, outgoing });
  } catch (error) {
    logger.error('Friend Requests GET error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

/**
 * POST /api/friends/requests — Sends a friend request
 */
export const POST = withAuth(async (req: Request, context, session) => {
  let receiverId: string | undefined;
  try {
    const body = await req.json();
    receiverId = body.receiverId;

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
    }

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: 'You cannot add yourself' }, { status: 400 });
    }

    // Check if already friends
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: receiverId },
          { userId: receiverId, friendId: session.user.id },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }

    // Check if request already exists
    const existingRequest = await db.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: session.user.id },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
      }
      // If declined, we could allow re-sending or have a timeout.
      // For now, let's just update the status back to pending if it was declined.
      if (existingRequest.status === 'DECLINED') {
        await db.friendRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: 'PENDING',
            senderId: session.user.id,
            receiverId: receiverId,
          },
        });
        return NextResponse.json({ success: true, message: 'Request re-sent' });
      }
    }

    await db.friendRequest.create({
      data: {
        senderId: session.user.id,
        receiverId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    logger.error('Friend Request POST error', { receiverId }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
