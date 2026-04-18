import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const collectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(50),
  description: z.string().max(200).optional(),
});

/**
 * GET /api/collections — Returns all collections for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collections = await db.collection.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('[API] Collections GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

/**
 * POST /api/collections — Creates a new collection
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = collectionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { name, description } = result.data;

    // Check for duplicate name
    const existing = await db.collection.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'A collection with this name already exists' }, { status: 400 });
    }

    const collection = await db.collection.create({
      data: {
        userId: session.user.id,
        name,
        description
      }
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('[API] Collections POST error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
