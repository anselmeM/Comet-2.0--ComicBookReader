/**
 * @file GET /api/comics/[id]/enrich — Fetches metadata from ComicVine and caches in DB.
 *
 * Queries the ComicVine API by comic title. Stores enrichment in the Comic.metadata JSONB.
 * Returns cached DB result on subsequent calls to avoid API rate limits.
 *
 * Requires: Valid Auth.js session + ownership of the comic
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { searchComicIssue } from '@/lib/comicvine';
import { parseStoredMetadata, serializeStoredMetadata } from '@/lib/metadata-parser';

export const GET = withAuth(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id: comicId } = await params;

    try {
      const comic = await db.comic.findFirst({
        where: { id: comicId, userId: session.user.id },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
      }

      // Return cached enrichment if available (allowed for all tiers)
      if (comic.metadata) {
        try {
          return NextResponse.json(parseStoredMetadata(comic.metadata), { status: 200 });
        } catch {
          // Ignore parse error and proceed
        }
      }

      // 1. Verify PREMIUM plan for fresh enrichment
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true },
      });

      if (user?.plan !== 'PREMIUM') {
        return NextResponse.json(
          {
            error:
              'Automatic metadata enrichment is a Premium feature. Upgrade to enable automatic series and issue detection.',
            code: 'PREMIUM_REQUIRED',
          },
          { status: 403 },
        );
      }

      // Fetch fresh metadata from ComicVine
      const enrichment = await searchComicIssue(comic.title);

      if (!enrichment) {
        return NextResponse.json({ error: 'No results from ComicVine' }, { status: 404 });
      }

      // Persist to DB cache
      await db.comic.update({
        where: { id: comicId },
        data: {
          comicVineId: enrichment.comicVineId,
          series: enrichment.series,
          issue: enrichment.issue,
          year: enrichment.year,
          coverUrl: enrichment.coverUrl ?? comic.coverUrl,
          metadata: serializeStoredMetadata(enrichment),
        },
      });

      return NextResponse.json(enrichment, { status: 200 });
    } catch (error) {
      logger.error('[ENRICH_ERROR]', {}, error as Error);
      const message = error instanceof Error ? error.message : 'Failed to enrich comic';
      const status = message.includes('API not configured') ? 503 : 502;

      return NextResponse.json({ error: message }, { status });
    }
  },
);
