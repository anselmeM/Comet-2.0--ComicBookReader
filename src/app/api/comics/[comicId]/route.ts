import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';

import { mapComicToDTO } from '@/types/dto';

/**
 * GET /api/comics/[id] — Returns metadata for a single comic, including reading progress.
 */
export async function GET(req: Request, { params }: { params: Promise<{ comicId: string }> }) {
  const { session, errorResponse } = await validateSession();
  if (errorResponse) return errorResponse;

  const { comicId: id } = await params;

  const comic = await db.comic.findFirst({
    where: {
      OR: [{ id }, { filehash: id }],
      userId: session.user.id,
    },
    include: { progress: true },
  });

  if (!comic) {
    return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
  }

  return NextResponse.json(mapComicToDTO(comic), { status: 200 });
}
