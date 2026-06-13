import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST /api/collections/[id]/items — Adds a comic to a collection
 */
export const POST = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, session) => {
    try {
      const { id } = await params;

      const body = await req.json();
      const { comicId } = body;

      if (!comicId) {
        return NextResponse.json({ error: 'Comic ID is required' }, { status: 400 });
      }

      // Verify collection ownership
      const collection = await db.collection.findUnique({
        where: { id, userId: session.user.id },
      });

      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }

      // Verify comic ownership
      const comic = await db.comic.findUnique({
        where: { id: comicId, userId: session.user.id },
      });

      if (!comic) {
        return NextResponse.json({ error: 'Comic not found or access denied' }, { status: 404 });
      }

      const item = await db.collectionItem.upsert({
        where: {
          collectionId_comicId: {
            collectionId: id,
            comicId,
          },
        },
        update: {}, // No-op if already exists
        create: {
          collectionId: id,
          comicId,
        },
      });

      return NextResponse.json({ item });
    } catch (error) {
      logger.error('[API] Collection Item POST error', {}, error as Error);
      return NextResponse.json({ error: 'Failed to add item to collection' }, { status: 500 });
    }
  },
);

/**
 * DELETE /api/collections/[id]/items — Removes a comic from a collection
 */
export const DELETE = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, session) => {
    try {
      const { id } = await params;

      const { searchParams } = new URL(req.url);
      const comicId = searchParams.get('comicId');

      if (!comicId) {
        return NextResponse.json({ error: 'Comic ID is required' }, { status: 400 });
      }

      // Verify ownership indirectly by deleting matching record
      await db.collectionItem.delete({
        where: {
          collectionId_comicId: {
            collectionId: id,
            comicId,
          },
          collection: {
            userId: session.user.id,
          },
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('[API] Collection Item DELETE error', {}, error as Error);
      return NextResponse.json({ error: 'Failed to remove item from collection' }, { status: 500 });
    }
  },
);
