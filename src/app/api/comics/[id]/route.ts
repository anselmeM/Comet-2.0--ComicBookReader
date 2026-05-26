import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const comicUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  series: z.string().max(255).optional().nullable(),
  issue: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(val => parseInt(val))]).optional().nullable(),
  year: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(val => parseInt(val))]).optional().nullable(),
  isFavorite: z.boolean().optional(),
  rating: z.number().int().min(0).max(5).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
});

/**
 * GET /api/comics/[id] — Returns metadata for a single comic, including reading progress.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
      { status: 401 }
    );
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

/**
 * PATCH /api/comics/[id] — Updates metadata for a comic.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
      { status: 401 }
    );
  }
  const { id } = await params;

  try {
    const rawBody = await req.json();
    const body = comicUpdateSchema.parse(rawBody);

    // Verify ownership
    const comic = await db.comic.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    const updated = await db.comic.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        series: body.series !== undefined ? body.series : undefined,
        issue: body.issue !== undefined ? body.issue : undefined,
        year: body.year !== undefined ? body.year : undefined,
        isFavorite: body.isFavorite !== undefined ? body.isFavorite : undefined,
        rating: body.rating !== undefined ? body.rating : undefined,
        tags: body.tags !== undefined ? (Array.isArray(body.tags) ? JSON.stringify(body.tags) : body.tags) : undefined,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    console.error(`[API PATCH /comics/${id}] ERROR:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/comics/[id] — Deletes a comic and its associated progress.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
      { status: 401 }
    );
  }
  const { id } = await params;

  try {
    // Verify ownership
    const comic = await db.comic.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    await db.comic.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`[API DELETE /comics/${id}] ERROR:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
