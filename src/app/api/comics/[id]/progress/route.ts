/**
 * @file API route for reading progress.
 * - GET /api/comics/[id]/progress — Fetches reading progress for a comic
 * - PUT /api/comics/[id]/progress — Updates reading progress for a comic
 *
 * Requires: Valid Auth.js session + ownership of the comic
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { UpdateProgressRequestSchema } from '@/types/schemas';
import { invalidateCache } from '@/lib/cache';

/**
 * GET /api/comics/[id]/progress — Fetches reading progress for a comic
 */
export const GET = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id: comicId } = await params;

    try {
      // Verify ownership through the comic
      const comic = await db.comic.findUnique({
        where: { id: comicId },
        include: { progress: true },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      if (comic.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(comic.progress, { status: 200 });
    } catch (err: unknown) {
      logger.error(`[API GET /comics/${comicId}/progress] ERROR`, {}, err as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);

/**
 * PUT /api/comics/[id]/progress — Updates reading progress for a comic.
 * Upserts the ReadingProgress record and updates User stats (streaks, time).
 */
export const PUT = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id: comicId } = await params;

    try {
      const json = await req.json();
      const result = UpdateProgressRequestSchema.safeParse(json);

      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: result.error.format() },
          { status: 400 },
        );
      }

      const body = result.data;

      // Additional validation: lastPage cannot exceed totalPages - 1
      if (body.lastPage >= body.totalPages && body.totalPages > 0) {
        return NextResponse.json(
          { error: 'lastPage cannot be greater than or equal to totalPages' },
          { status: 400 },
        );
      }

      // 1. Verify ownership and fetch user for streak logic
      const [comic, user] = await Promise.all([
        db.comic.findUnique({ where: { id: comicId } }),
        db.user.findUnique({ where: { id: session.user.id } }),
      ]);

      if (!comic || !user) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      if (comic.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 2. Sanity check for timeDelta: Ensure it's not logically impossible
      // Fetch current progress to check last update time
      const currentProgress = await db.readingProgress.findUnique({
        where: { comicId },
      });

      let validatedTimeDelta = body.timeDelta || 0;
      if (currentProgress?.lastReadAt && validatedTimeDelta > 0) {
        const msSinceLastUpdate = Date.now() - new Date(currentProgress.lastReadAt).getTime();
        const secondsSinceLastUpdate = Math.ceil(msSinceLastUpdate / 1000) + 30; // 30s buffer for clock drift/network

        if (validatedTimeDelta > secondsSinceLastUpdate) {
          logger.warn('[API] Suspicious timeDelta reported', {
            userId: session.user.id,
            comicId,
            validatedTimeDelta,
            secondsSinceLastUpdate,
          });
          validatedTimeDelta = secondsSinceLastUpdate;
        }
      }

      // 3. Determine read status
      const readStatus =
        body.readStatus ??
        (body.lastPage === 0
          ? 'UNREAD'
          : body.lastPage >= body.totalPages - 1
            ? 'COMPLETED'
            : 'READING');

      // 4. Streak Logic
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastRead = user.lastReadDate ? new Date(user.lastReadDate) : null;
      if (lastRead) lastRead.setHours(0, 0, 0, 0);

      let newStreak = user.readingStreak;
      if (!lastRead) {
        newStreak = 1;
      } else {
        const diffDays = Math.floor((today.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        // if diffDays === 0, streak remains unchanged
      }

      // 5. Run database updates in a transaction
      const [progress] = await db.$transaction([
        db.readingProgress.upsert({
          where: { comicId },
          update: {
            lastPage: body.lastPage,
            totalPages: body.totalPages,
            zoomLevel: body.zoomLevel,
            readStatus,
            totalTimeSpent: { increment: validatedTimeDelta },
            lastReadAt: now,
          },
          create: {
            userId: session.user.id,
            comicId,
            lastPage: body.lastPage,
            totalPages: body.totalPages,
            zoomLevel: body.zoomLevel,
            readStatus,
            totalTimeSpent: validatedTimeDelta,
            lastReadAt: now,
          },
        }),
        db.comic.update({
          where: { id: comicId },
          data: { lastReadAt: now },
        }),
        db.user.update({
          where: { id: session.user.id },
          data: {
            readingStreak: newStreak,
            lastReadDate: now,
          },
        }),
      ]);

      // Invalidate library cache for this user since reading progress changed
      await invalidateCache(`comet:u:${session.user.id}:library`, true);

      return NextResponse.json(progress, { status: 200 });
    } catch (err: unknown) {
      logger.error(`[API PUT /comics/${comicId}/progress] ERROR`, {}, err as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);

/**
 * DELETE /api/comics/[id]/progress — Resets reading progress for a comic
 */
export const DELETE = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id: comicId } = await params;

    try {
      // Verify ownership
      const comic = await db.comic.findUnique({
        where: { id: comicId },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      if (comic.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Delete the progress and reset lastReadAt
      await db.$transaction([
        db.readingProgress.delete({
          where: { comicId },
        }),
        db.comic.update({
          where: { id: comicId },
          data: { lastReadAt: null },
        }),
      ]);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ success: true }, { status: 200 });
      }
      logger.error(`[API DELETE /comics/${comicId}/progress] ERROR`, {}, err as Error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
);
