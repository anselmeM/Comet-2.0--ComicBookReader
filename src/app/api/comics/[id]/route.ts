import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/comics/[id] — Returns metadata for a single comic, including reading progress.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const comic = await db.comic.findFirst({
    where: { 
      OR: [
        { id },
        { filehash: id }
      ],
      userId: session.user.id 
    },
    include: { progress: true },
  });

  if (!comic) {
    return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
  }

  return NextResponse.json(comic, { status: 200 });
}
