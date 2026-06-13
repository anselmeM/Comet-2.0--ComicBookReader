import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * PATCH /api/notifications/[id] — Marks a single notification as read
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let id: string | undefined;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    ({ id } = await params);

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Notification PATCH error', { id }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/[id] — Deletes a single notification
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let id: string | undefined;
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    ({ id } = await params);

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Notification DELETE error', { id }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
