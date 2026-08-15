import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  let query: string | null = null;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await db.user.findMany({
      where: {
        AND: [
          // Match by name only — matching email would enable account
          // enumeration, and email addresses are never returned to other users.
          { name: { contains: query } },
          { id: { not: session.user.id } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: 10,
    });

    // Batch relationship lookups (3 queries total instead of 3 per user)
    const userIds = users.map((u) => u.id);

    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { userId: session.user.id, friendId: { in: userIds } },
          { userId: { in: userIds }, friendId: session.user.id },
        ],
      },
    });

    const sentRequests = await db.friendRequest.findMany({
      where: { senderId: session.user.id, receiverId: { in: userIds } },
    });

    const receivedRequests = await db.friendRequest.findMany({
      where: { senderId: { in: userIds }, receiverId: session.user.id },
    });

    const usersWithStatus = users.map((user) => {
      const isFriend = friendships.some(
        (f) =>
          (f.userId === session.user.id && f.friendId === user.id) ||
          (f.userId === user.id && f.friendId === session.user.id),
      );
      if (isFriend) return { ...user, status: 'FRIEND' };

      const sent = sentRequests.find((r) => r.receiverId === user.id);
      if (sent) return { ...user, status: 'REQUEST_SENT', requestId: sent.id };

      const received = receivedRequests.find((r) => r.senderId === user.id);
      if (received) return { ...user, status: 'REQUEST_RECEIVED', requestId: received.id };

      return { ...user, status: 'NONE' };
    });

    return NextResponse.json({ users: usersWithStatus });
  } catch (error) {
    logger.error('Users Search Error', { query: query || undefined }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
