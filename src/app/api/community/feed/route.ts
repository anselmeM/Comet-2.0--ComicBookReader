import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/community/feed — Returns a list of recent public activities
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
        { status: 401 }
      );
    }

    // For a real app, we'd have an Activity model.
    // For now, let's derive it from recent comics and friendships.
    
    const recentComics = await db.comic.findMany({
      take: 10,
      orderBy: { addedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    const feed = recentComics.map(comic => ({
      id: comic.id,
      type: 'READ',
      userName: comic.user.name || 'A reader',
      userImage: comic.user.image,
      userId: comic.user.id,
      targetName: comic.title,
      timestamp: comic.addedAt,
    }));

    return NextResponse.json({ feed });
  } catch (error) {
    console.error('[API] Community Feed GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
