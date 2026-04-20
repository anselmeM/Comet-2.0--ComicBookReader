import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

/**
 * PUT /api/friends/requests/[id] — Accepts or declines a friend request
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { action } = await req.json(); // 'ACCEPT' or 'DECLINE'

    if (!['ACCEPT', 'DECLINE'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const request = await db.friendRequest.findUnique({
      where: { id },
      include: {
        receiver: {
          select: { name: true }
        }
      }
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    if (action === 'DECLINE') {
      await db.friendRequest.update({
        where: { id },
        data: { status: 'DECLINED' },
      });
      return NextResponse.json({ success: true, message: 'Friend request declined' });
    }

    // ACCEPT action
    // Use transaction to ensure all records are created/updated
    await db.$transaction([
      db.friendRequest.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      }),
      db.friendship.create({
        data: {
          userId: request.senderId,
          friendId: request.receiverId,
        },
      }),
    ]);

    // Create notification for the sender
    await createNotification({
      userId: request.senderId,
      type: 'FRIEND_REQUEST_ACCEPTED',
      title: 'Friend Request Accepted',
      message: `${request.receiver.name || 'A user'} accepted your friend request!`,
      link: '/friends', // Link to friends page
    });

    return NextResponse.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('[API] Friend Request PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
