import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { getDownloadUrl } from '@/lib/storage';

export const GET = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }, session) => {
    const { id } = await params;

    try {
      const comic = await db.comic.findUnique({
        where: { id, userId: session.user.id },
        select: { storageKey: true },
      });

      if (!comic || !comic.storageKey) {
        return NextResponse.json(
          { error: 'Comic not found or not in cloud storage' },
          { status: 404 },
        );
      }

      // Generate a signed URL valid for 10 minutes
      const downloadUrl = await getDownloadUrl(comic.storageKey, 600);

      return NextResponse.json({ downloadUrl });
    } catch {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }
  },
);
