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
          {
            OR: [{ name: { contains: query } }, { email: { contains: query } }],
          },
          { id: { not: session.user.id } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
      },
      take: 10,
    });

    // Check relationship status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await db.friendship.findFirst({
          where: {
            OR: [
              { userId: session.user.id, friendId: user.id },
              { userId: user.id, friendId: session.user.id },
            ],
          },
        });

        if (friendship) {
          return { ...user, status: 'FRIEND' };
        }

        const sentRequest = await db.friendRequest.findUnique({
          where: {
            senderId_receiverId: {
              senderId: session.user.id,
              receiverId: user.id,
            },
          },
        });

        if (sentRequest) {
          return { ...user, status: 'REQUEST_SENT', requestId: sentRequest.id };
        }

        const receivedRequest = await db.friendRequest.findUnique({
          where: {
            senderId_receiverId: {
              senderId: user.id,
              receiverId: session.user.id,
            },
          },
        });

        if (receivedRequest) {
          return { ...user, status: 'REQUEST_RECEIVED', requestId: receivedRequest.id };
        }

        return { ...user, status: 'NONE' };
      }),
    );

    return NextResponse.json({ users: usersWithStatus });
  } catch (error) {
    logger.error('Users Search Error', { query: query || undefined }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
