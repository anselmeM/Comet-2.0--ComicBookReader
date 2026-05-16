import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const collectionUpdateSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(50).optional(),
  description: z.string().max(200).optional(),
});

/**
 * GET /api/collections/[id] — Returns a single collection with its comics
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
        { status: 401 }
      );
    }

    const collection = await db.collection.findUnique({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        items: {
          include: {
            comic: {
              include: {
                progress: {
                  where: { userId: session.user.id }
                }
              }
            }
          },
          orderBy: { addedAt: 'desc' }
        }
      }
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Flatten items for easier consumption
    const result = {
      ...collection,
      comics: collection.items.map(item => item.comic)
    };

    return NextResponse.json({ collection: result });
  } catch (error) {
    console.error('[API] Collection GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

/**
 * PATCH /api/collections/[id] — Updates a collection's details
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = collectionUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const updated = await db.collection.update({
      where: {
        id,
        userId: session.user.id
      },
      data: result.data
    });

    return NextResponse.json({ collection: updated });
  } catch (error) {
    console.error('[API] Collection PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

/**
 * DELETE /api/collections/[id] — Deletes a collection
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
        { status: 401 }
      );
    }

    await db.collection.delete({
      where: {
        id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Collection DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
