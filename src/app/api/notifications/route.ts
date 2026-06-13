import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/notifications — Returns all notifications for the authenticated user
 */
export async function GET() {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent 50
    });

    const unreadCount = await db.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    logger.error('Notifications GET error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications — Marks all notifications as read
 */
export async function PATCH() {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Notifications PATCH error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications — Clears all notifications
 */
export async function DELETE() {
  try {
    const { session, errorResponse } = await validateSession();
    if (errorResponse) return errorResponse;

    await db.notification.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Notifications DELETE error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
