/**
 * @file GET /api/library — Returns the authenticated user's comic library
 *       POST /api/library — Adds a new comic to the library
 *
 * Requires: Valid Auth.js session
 */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import type { AddComicPayload } from '@/types';

/** GET /api/library */
export async function GET(req: Request) {
  const session = await auth();
  const cookieHeader = req.headers.get('cookie') || 'None';
  
  console.log('[API GET /library] Auth check:', {
    authenticated: !!session?.user?.id,
    userId: session?.user?.id,
    cookiePreview: cookieHeader.substring(0, 50) + '...',
  });
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const comics = await db.comic.findMany({
    where: { userId: session.user.id },
    include: { progress: true },
    orderBy: { lastReadAt: 'desc' },
  });

  return NextResponse.json(comics, { status: 200 });
}

/** POST /api/library */
export async function POST(req: Request) {
  const session = await auth();
  const cookieHeader = req.headers.get('cookie') || 'None';
  
  // High-resolution debugging
  console.log('--- Auth Debug Start ---');
  console.log('[API POST /library] Session:', session);
  console.log('[API POST /library] Cookies:', cookieHeader);
  console.log('[API POST /library] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('[API POST /library] AUTH_URL:', process.env.AUTH_URL);
  console.log('--- Auth Debug End ---');

  if (!session?.user?.id) {
    return NextResponse.json({ 
      error: 'Unauthorized', 
      details: 'No active session.',
      debug: {
        hasSession: !!session,
        hasUser: !!session?.user,
        cookiePresent: cookieHeader !== 'None'
      }
    }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type');
    const contentLength = req.headers.get('content-length');
    console.log(`[API POST /library] Request: ${contentType}, Length: ${contentLength} bytes`);

    const body = (await req.json()) as AddComicPayload;
    console.log('[API POST /library] payload received:', body.title, body.filehash);

    // Basic validation
    if (!body.title || !body.filehash || !body.pageCount) {
      console.warn('[API POST /library] missing fields:', { 
        title: !!body.title, 
        filehash: !!body.filehash, 
        pageCount: !!body.pageCount 
      });
      return NextResponse.json(
        { error: 'Missing required fields: title, filehash, pageCount' },
        { status: 400 },
      );
    }

    // Upsert: if same user uploads same file again, update instead of duplicating
    const comic = await db.comic.upsert({
      where: { userId_filehash: { userId: session.user.id, filehash: body.filehash } },
      update: { title: body.title, coverUrl: body.coverUrl, lastReadAt: new Date() },
      create: {
        userId: session.user.id,
        title: body.title,
        filehash: body.filehash,
        pageCount: body.pageCount,
        coverUrl: body.coverUrl ?? null,
      },
    });

    return NextResponse.json(comic, { status: 201 });
  } catch (err: unknown) {
    console.error('[API POST /library] ERROR:', err);
    const details = err instanceof Error ? err.stack || err.message : String(err);
    return NextResponse.json(
      { error: 'Internal server error', details },
      { status: 500 },
    );
  }
}
