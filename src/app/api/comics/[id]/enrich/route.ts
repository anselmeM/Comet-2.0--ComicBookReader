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
import type { EnrichmentData } from '@/types';

const COMICVINE_BASE = 'https://comicvine.gamespot.com/api';
const COMICVINE_API_KEY = process.env.COMICVINE_API_KEY!;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: comicId } = await params;

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

  if (!COMICVINE_API_KEY) {
    return NextResponse.json(
      { error: 'ComicVine API not configured' },
      { status: 503 },
    );
  }

  // Search ComicVine by title
  const searchUrl = new URL(`${COMICVINE_BASE}/search/`);
  searchUrl.searchParams.set('api_key', COMICVINE_API_KEY);
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('query', comic.title);
  searchUrl.searchParams.set('resources', 'issue');
  searchUrl.searchParams.set('limit', '1');
  searchUrl.searchParams.set('field_list', 'id,name,issue_number,cover_date,image,volume,character_credits,publisher');

  const response = await fetch(searchUrl.toString(), {
    headers: { 'User-Agent': 'Comet Comic Reader/2.0' },
    next: { revalidate: 60 * 60 * 24 }, // Cache at the Edge for 24h
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `ComicVine API error: ${response.statusText}` },
      { status: 502 },
    );
  }

  const data = await response.json();
  const result = data?.results?.[0];

  if (!result) {
    return NextResponse.json({ error: 'No results from ComicVine' }, { status: 404 });
  }

  const enrichment: EnrichmentData = {
    comicVineId: String(result.id),
    series: result.volume?.name ?? null,
    issue: result.issue_number ? parseInt(result.issue_number, 10) : null,
    year: result.cover_date ? new Date(result.cover_date).getFullYear() : null,
    description: result.deck ?? null,
    coverUrl: result.image?.original_url ?? null,
    characters: result.character_credits?.map((c: { name: string }) => c.name) ?? [],
    publishers: result.publisher?.name ? [result.publisher.name] : [],
  };

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
}
