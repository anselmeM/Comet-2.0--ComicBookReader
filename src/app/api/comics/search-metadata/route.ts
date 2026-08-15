import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/errors';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const COMICVINE_BASE = 'https://comicvine.gamespot.com/api';
const API_KEY = process.env.COMICVINE_API_KEY;

export const GET = withAuth(async (req: Request, context, session) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'ComicVine API key is not configured' }, { status: 503 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (user?.plan !== 'PREMIUM') {
      return NextResponse.json(
        {
          error:
            'Automatic metadata search is a Premium feature. Upgrade to enable online database searching.',
          code: 'PREMIUM_REQUIRED',
        },
        { status: 403 },
      );
    }

    const searchUrl = new URL(`${COMICVINE_BASE}/search/`);
    searchUrl.searchParams.set('api_key', API_KEY);
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('resources', 'issue');
    searchUrl.searchParams.set('limit', '5');
    searchUrl.searchParams.set(
      'field_list',
      'id,name,issue_number,cover_date,image,volume,description,deck',
    );

    const response = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': 'Comet Comic Reader/2.0' },
    });

    if (!response.ok) {
      throw new Error(`ComicVine API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = (data?.results ?? []).map((result: {
          id?: string;
          name?: string;
          issue_number?: string;
          volume?: { name?: string };
          cover_date?: string;
          deck?: string;
          description?: string;
          image?: { original_url?: string; thumb_url?: string };
        }) => ({
      comicVineId: String(result.id),
      title:
        result.name ||
        (result.volume?.name ? `${result.volume.name} #${result.issue_number}` : 'Unknown Title'),
      series: result.volume?.name ?? '',
      issue: result.issue_number ? parseInt(result.issue_number, 10) : null,
      year: result.cover_date ? new Date(result.cover_date).getFullYear() : null,
      coverUrl: result.image?.thumb_url || result.image?.original_url || null,
      description: result.deck || result.description || null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Failed to search ComicVine metadata', { query }, error as Error);
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to search ComicVine' },
      { status: 502 },
    );
  }
});
