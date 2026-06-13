import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

import { CollectionUpdateSchema } from '@/types/schemas';

/**
 * GET /api/collections/[id] — Returns a single collection with its comics
 */
export const GET = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, session) => {
    try {
      const { id } = await params;

      const collection = await db.collection.findUnique({
        where: {
          id,
          userId: session.user.id,
        },
        include: {
          items: {
            include: {
              comic: {
                include: {
                  progress: {
                    where: { userId: session.user.id },
                  },
                },
              },
            },
            orderBy: { addedAt: 'desc' },
          },
        },
      });

      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }

      // Flatten items for easier consumption
      const result = {
        ...collection,
        comics: collection.items.map((item) => item.comic),
      };

      return NextResponse.json({ collection: result });
    } catch (error) {
      logger.error('[API] Collection GET error', {}, error as Error);
      return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
    }
  },
);

/**
 * PATCH /api/collections/[id] — Updates a collection's details
 */
export const PATCH = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, session) => {
    try {
      const { id } = await params;

      const body = await req.json();
      const result = CollectionUpdateSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
      }

      const updated = await db.collection.update({
        where: {
          id,
          userId: session.user.id,
        },
        data: result.data,
      });

      return NextResponse.json({ collection: updated });
    } catch (error) {
      logger.error('[API] Collection PATCH error', {}, error as Error);
      return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
    }
  },
);

/**
 * DELETE /api/collections/[id] — Deletes a collection
 */
export const DELETE = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, session) => {
    try {
      const { id } = await params;

      await db.collection.delete({
        where: {
          id,
          userId: session.user.id,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('[API] Collection DELETE error', {}, error as Error);
      return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
    }
  },
);
