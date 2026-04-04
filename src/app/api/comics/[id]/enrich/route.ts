/**
 * @file GET /api/comics/[id]/enrich — Fetches metadata from ComicVine and caches in DB.
 *
 * Queries the ComicVine API by comic title. Stores enrichment in the Comic.metadata JSONB.
 * Returns cached DB result on subsequent calls to avoid API rate limits.
 *
 * Requires: Valid Auth.js session + ownership of the comic
 */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { searchComicIssue } from '@/lib/comicvine';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: comicId } = await params;

  try {
    const comic = await db.comic.findFirst({
      where: { id: comicId, userId: session.user.id },
    });

    if (!comic) {
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
    }

    // Return cached enrichment if available
    if (comic.metadata) {
      try {
        return NextResponse.json(JSON.parse(comic.metadata as string), { status: 200 });
      } catch {
        // Ignore parse error and fetch fresh
      }
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
        metadata: JSON.stringify(enrichment),
      },
    });

    return NextResponse.json(enrichment, { status: 200 });
  } catch (error) {
    console.error('[ENRICH_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Failed to enrich comic';
    const status = message.includes('API not configured') ? 503 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
