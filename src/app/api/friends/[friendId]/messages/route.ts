import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/friends/[friendId]/messages — Fetch DM history with a specific friend.
 *
 * Cursor pagination: newest-first, `?limit=` (default 50, max 100) and
 * `?cursor=<createdAt ISO>` to page into older messages. The response is
 * `{ messages, nextCursor }` — `nextCursor` is null when there is no older page.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ friendId: string }> }) {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const { friendId } = await params;

    // Verify friendship
    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId },
          { userId: friendId, friendId: session.user.id },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'You are not friends with this user' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 50), 1), 100);

    const messages = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: friendId },
          { senderId: friendId, receiverId: session.user.id },
        ],
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const nextCursor =
      messages.length === limit && messages.length > 0
        ? messages[messages.length - 1].createdAt.toISOString()
        : null;

    // Mark received messages as read
    const unreadMessages = messages.filter((m) => m.receiverId === session.user.id && !m.isRead);
    if (unreadMessages.length > 0) {
      await db.directMessage.updateMany({
        where: {
          id: { in: unreadMessages.map((m) => m.id) },
        },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ messages, nextCursor });
  } catch (error) {
    logger.error('Messages GET error', {}, error as Error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/friends/[friendId]/messages — Send a new DM to a friend
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> },
) {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const { friendId } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify friendship
    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId },
          { userId: friendId, friendId: session.user.id },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'You are not friends with this user' }, { status: 403 });
    }

    const newMessage = await db.directMessage.create({
      data: {
        senderId: session.user.id,
        receiverId: friendId,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Optional: We can create a system Notification for the receiver
    await db.notification.create({
      data: {
        userId: friendId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${session.user.name || 'A friend'} sent you a message.`,
        link: `/library?view=friends`, // A generic link to friends view
      },
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    logger.error('Messages POST error', {}, error as Error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
