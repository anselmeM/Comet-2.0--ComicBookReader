import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
            ],
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
      })
    );

    return NextResponse.json({ users: usersWithStatus });
  } catch (error) {
    console.error('[API] Users Search Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
