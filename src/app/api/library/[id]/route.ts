/**
 * @file DELETE /api/library/[id] — Removes a comic from the user's library
 *
 * Requires: Valid Auth.js session and ownership of the comic
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const DELETE = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id } = await params;

    try {
      // 1. Check ownership before deleting
      const comic = await db.comic.findUnique({
        where: { id },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      if (comic.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 2. Delete the comic (cascade will handle progress if configured,
      // but Prisma typically needs explicit relation handling if not in schema)
      await db.comic.delete({
        where: { id },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: unknown) {
      logger.error('Failed to delete library comic', { id }, err as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);
