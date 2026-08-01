import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/storage';
import { z } from 'zod';
import { invalidateCache } from '@/lib/cache';
import { logger } from '@/lib/logger';

import { UpdateComicRequestSchema } from '@/types/schemas';
import { parseComicFilename } from '@/lib/metadata-parser';

/**
 * GET /api/comics/[id] — Returns metadata for a single comic, including reading progress.
 */
export const GET = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id } = await params;

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

    if (!comic.series) {
      const parsed = parseComicFilename(comic.title);
      comic.series = parsed.series;
      if (comic.issue === null) comic.issue = parsed.issue;
      if (comic.year === null) comic.year = parsed.year;
    }

    return NextResponse.json(comic, { status: 200 });
  },
);

/**
 * PATCH /api/comics/[id] — Updates metadata for a comic.
 */
export const PATCH = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id } = await params;

    try {
      const rawBody = await req.json();
      const body = UpdateComicRequestSchema.parse(rawBody);

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
          rating: body.rating !== undefined ? body.rating : undefined,
          tags:
            body.tags !== undefined
              ? Array.isArray(body.tags)
                ? JSON.stringify(body.tags)
                : body.tags
              : undefined,
          coverUrl: body.coverUrl !== undefined ? body.coverUrl : undefined,
          comicVineId: body.comicVineId !== undefined ? body.comicVineId : undefined,
          pageCount: body.pageCount !== undefined ? body.pageCount : undefined,
          sizeBytes: body.sizeBytes !== undefined ? body.sizeBytes : undefined,
        },
      });

      // Invalidate library cache for this user since fields (like isFavorite) changed
      await invalidateCache(`comet:u:${session.user.id}:library`, true);

      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
      }
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
      logger.error('Failed to patch comic', { id }, error as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);

/**
 * DELETE /api/comics/[id] — Deletes a comic and its associated progress.
 */
export const DELETE = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id } = await params;

    try {
      // Verify ownership
      const comic = await db.comic.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      if (comic.storageKey) {
        await deleteFile(comic.storageKey);
      }

      await db.comic.delete({
        where: { id },
      });

      // Invalidate library cache for this user since a comic was removed
      await invalidateCache(`comet:u:${session.user.id}:library`, true);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      logger.error('Failed to delete comic', { id }, error as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);
