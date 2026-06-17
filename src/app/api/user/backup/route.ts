import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/user/backup
 * Exports user settings, streaks, reading history, and custom metadata.
 */
export const GET = withAuth(async (req: Request, context, session) => {
  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        defaultReadingMode: true,
        theme: true,
        readingStreak: true,
        lastReadDate: true,
      },
    });

    const comics = await db.comic.findMany({
      where: { userId: session.user.id },
      include: {
        progress: true,
        bookmarks: true,
      },
    });

    const comicsData = comics.map((c) => ({
      filehash: c.filehash,
      title: c.title,
      series: c.series,
      issue: c.issue,
      year: c.year,
      isFavorite: c.isFavorite,
      rating: c.rating,
      tags: c.tags,
      metadata: c.metadata,
      progress: c.progress
        ? {
            lastPage: c.progress.lastPage,
            totalPages: c.progress.totalPages,
            zoomLevel: c.progress.zoomLevel,
            readStatus: c.progress.readStatus,
            totalTimeSpent: c.progress.totalTimeSpent,
            lastReadAt: c.progress.lastReadAt ? c.progress.lastReadAt.toISOString() : null,
          }
        : null,
      bookmarks: c.bookmarks.map((b) => ({
        pageNumber: b.pageNumber,
        label: b.label,
        note: b.note,
      })),
    }));

    return NextResponse.json({
      version: 1,
      backupDate: new Date().toISOString(),
      settings: {
        defaultReadingMode: user?.defaultReadingMode || 'single-page',
        theme: user?.theme || 'dark',
      },
      streaks: {
        readingStreak: user?.readingStreak || 0,
        lastReadDate: user?.lastReadDate ? user.lastReadDate.toISOString() : null,
      },
      comicsData,
    });
  } catch (error) {
    logger.error('Export Backup Error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to export backup data' }, { status: 500 });
  }
});

/**
 * POST /api/user/backup
 * Imports user settings, streaks, reading history, and custom metadata.
 */
export const POST = withAuth(async (req: Request, context, session) => {
  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Restore User Settings and Streaks
      if (body.settings || body.streaks) {
        const userData: Record<string, any> = {};

        if (body.settings?.defaultReadingMode) {
          userData.defaultReadingMode = body.settings.defaultReadingMode;
        }
        if (body.settings?.theme) {
          userData.theme = body.settings.theme;
        }
        if (body.streaks?.readingStreak !== undefined) {
          userData.readingStreak = body.streaks.readingStreak;
        }
        if (body.streaks?.lastReadDate !== undefined) {
          userData.lastReadDate = body.streaks.lastReadDate
            ? new Date(body.streaks.lastReadDate)
            : null;
        }

        if (Object.keys(userData).length > 0) {
          await tx.user.update({
            where: { id: session.user.id },
            data: userData,
          });
        }
      }

      // 2. Restore Comic Metadata, Progress, Bookmarks (mapped by filehash)
      let comicsRestoredCount = 0;
      if (Array.isArray(body.comicsData)) {
        for (const item of body.comicsData) {
          if (!item.filehash) continue;

          // Find the existing comic in the user's library with this filehash
          const existingComic = await tx.comic.findUnique({
            where: {
              userId_filehash: {
                userId: session.user.id,
                filehash: item.filehash,
              },
            },
          });

          if (existingComic) {
            comicsRestoredCount++;

            // Update custom metadata
            await tx.comic.update({
              where: { id: existingComic.id },
              data: {
                title: item.title ?? undefined,
                series: item.series ?? null,
                issue: item.issue ?? null,
                year: item.year ?? null,
                isFavorite: item.isFavorite ?? false,
                rating: item.rating ?? 0,
                tags: item.tags ?? null,
                metadata: item.metadata ?? null,
              },
            });

            // Upsert ReadingProgress
            if (item.progress) {
              await tx.readingProgress.upsert({
                where: {
                  userId_comicId: {
                    userId: session.user.id,
                    comicId: existingComic.id,
                  },
                },
                update: {
                  lastPage: item.progress.lastPage,
                  totalPages: item.progress.totalPages,
                  zoomLevel: item.progress.zoomLevel ?? 1.0,
                  readStatus: item.progress.readStatus ?? 'UNREAD',
                  totalTimeSpent: item.progress.totalTimeSpent ?? 0,
                  lastReadAt: item.progress.lastReadAt
                    ? new Date(item.progress.lastReadAt)
                    : new Date(),
                },
                create: {
                  userId: session.user.id,
                  comicId: existingComic.id,
                  lastPage: item.progress.lastPage,
                  totalPages: item.progress.totalPages,
                  zoomLevel: item.progress.zoomLevel ?? 1.0,
                  readStatus: item.progress.readStatus ?? 'UNREAD',
                  totalTimeSpent: item.progress.totalTimeSpent ?? 0,
                  lastReadAt: item.progress.lastReadAt
                    ? new Date(item.progress.lastReadAt)
                    : new Date(),
                },
              });
            }

            // Upsert Bookmarks
            if (Array.isArray(item.bookmarks)) {
              for (const b of item.bookmarks) {
                await tx.bookmark.upsert({
                  where: {
                    userId_comicId_pageNumber: {
                      userId: session.user.id,
                      comicId: existingComic.id,
                      pageNumber: b.pageNumber,
                    },
                  },
                  update: {
                    label: b.label ?? null,
                    note: b.note ?? null,
                  },
                  create: {
                    userId: session.user.id,
                    comicId: existingComic.id,
                    pageNumber: b.pageNumber,
                    label: b.label ?? null,
                    note: b.note ?? null,
                  },
                });
              }
            }
          }
        }
      }

      return { comicsRestoredCount };
    });

    return NextResponse.json({
      success: true,
      updatedSettings: true,
      comicsRestoredCount: result.comicsRestoredCount,
    });
  } catch (error) {
    logger.error('Import Backup Error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to import backup data' }, { status: 500 });
  }
});
