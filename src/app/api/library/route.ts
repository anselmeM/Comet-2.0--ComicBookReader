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
   
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse pagination parameters from URL
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  // Get total count for pagination info
  const total = await db.comic.count({
    where: { userId: session.user.id },
  });

  const comics = await db.comic.findMany({
    where: { userId: session.user.id },
    include: { progress: true },
    orderBy: { lastReadAt: 'desc' },
    take: limit,
    skip: skip,
  });

  // Return paginated response
  return NextResponse.json({
    data: comics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, { status: 200 });
}

/** POST /api/library */
export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ 
      error: 'Unauthorized', 
      details: 'No active session.',
    }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type. Expected application/json' }, { status: 415 });
    }

    const body = (await req.json()) as AddComicPayload;
    
    // Validation
    if (!body.title || !body.filehash || typeof body.pageCount !== 'number') {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: 'Missing or invalid required fields: title, filehash, pageCount' 
        },
        { status: 400 },
      );
    }

    // Protection against massive base64 payloads even if client sends them
    if (body.coverUrl && body.coverUrl.length > 200000) { // 200KB hard limit for cover
       return NextResponse.json(
        { error: 'Cover image too large', details: 'The cover image exceeds the maximum allowed size.' },
        { status: 413 },
      );
    }

    // Verify user exists in database before attempting upsert
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!dbUser) {
      console.error('[API POST /library] User not found in database:', session.user.id);
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Your session is stale. Please sign out and sign in again.' },
        { status: 401 },
      );
    }

    // Upsert: if same user uploads same file again, update instead of duplicating
    const comic = await db.comic.upsert({
      where: { userId_filehash: { userId: session.user.id, filehash: body.filehash } },
      update: { 
        title: body.title, 
        coverUrl: body.coverUrl || undefined, 
        lastReadAt: new Date() 
      },
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
    
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
