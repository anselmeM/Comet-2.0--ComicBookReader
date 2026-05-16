import { db } from '@/lib/db';

export type NotificationType = 
  | 'FRIEND_REQUEST_ACCEPTED' 
  | 'NEW_MESSAGE' 
  | 'CONTENT_LIKE' 
  | 'CONTENT_COMMENT' 
  | 'NEW_CONTENT' 
  | 'SYSTEM_ALERT';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Creates a notification for a user in the database.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link
}: CreateNotificationParams) {
  try {
    return await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    });
  } catch (error) {
    console.error('[Notifications] Failed to create notification:', error);
    return null;
  }
}

/**
 * Batch creates notifications (e.g., for system alerts to multiple users).
 */
export async function createBatchNotifications(notifications: CreateNotificationParams[]) {
  try {
    return await db.notification.createMany({
      data: notifications
    });
  } catch (error) {
    console.error('[Notifications] Failed to create batch notifications:', error);
    return null;
  }
}
