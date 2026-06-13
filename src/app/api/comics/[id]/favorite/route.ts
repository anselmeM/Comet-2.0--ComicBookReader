import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';
import { logger } from '@/lib/logger';

/**
 * POST /api/comics/[id]/favorite — Adds a comic to the user's favorites
 */
export const POST = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    let id: string | undefined;
    try {
      ({ id } = await params);

      // Verify ownership
      const comic = await db.comic.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      const updated = await db.comic.update({
        where: { id },
        data: { isFavorite: true },
      });

      // Invalidate library cache for this user since isFavorite changed
      await invalidateCache(`comet:u:${session.user.id}:library`, true);

      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      logger.error('Failed to favorite comic', { id }, error as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);

/**
 * DELETE /api/comics/[id]/favorite — Removes a comic from the user's favorites
 */
export const DELETE = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    let id: string | undefined;
    try {
      ({ id } = await params);

      // Verify ownership
      const comic = await db.comic.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      const updated = await db.comic.update({
        where: { id },
        data: { isFavorite: false },
      });

      // Invalidate library cache for this user since isFavorite changed
      await invalidateCache(`comet:u:${session.user.id}:library`, true);

      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      logger.error('Failed to unfavorite comic', { id }, error as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);
