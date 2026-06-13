import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

import { CollectionSchema } from '@/types/schemas';

/**
 * GET /api/collections — Returns all collections for the authenticated user
 */
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const collections = await db.collection.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ collections });
  } catch (error) {
    logger.error('[API] Collections GET error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
});

/**
 * POST /api/collections — Creates a new collection
 */
export const POST = withAuth(async (req: NextRequest, context, session) => {
  try {
    const body = await req.json();
    const result = CollectionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, description } = result.data;

    // Check for duplicate name
    const existing = await db.collection.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A collection with this name already exists' },
        { status: 400 },
      );
    }

    const collection = await db.collection.create({
      data: {
        userId: session.user.id,
        name,
        description,
      },
    });

    return NextResponse.json({ collection });
  } catch (error) {
    logger.error('[API] Collections POST error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
});
