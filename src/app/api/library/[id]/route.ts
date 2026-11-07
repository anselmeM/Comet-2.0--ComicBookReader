/**
 * @file DELETE /api/library/[id] — Removes a comic from the user's library
 *
 * Requires: Valid Clerk session and ownership of the comic
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/storage';
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

      // 2. Delete the cloud object BEFORE the row (same ordering as
      // /api/comics/[id]). This is best-effort: a storage failure must not block
      // the user's delete (an orphaned object is recoverable, an undeletable row
      // is not), so log it and continue.
      if (comic.storageKey) {
        try {
          await deleteFile(comic.storageKey);
        } catch (storageErr) {
          logger.error(
            'Failed to delete comic object from storage',
            { id, storageKey: comic.storageKey },
            storageErr as Error,
          );
        }
      }

      // 3. Delete the comic row — schema relations cascade (progress, bookmarks,
      // collection items, reading sessions, comments, reactions).
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
