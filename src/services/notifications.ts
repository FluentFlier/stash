import { getMessaging } from '../config/firebase.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotificationPayload } from '../types/api.js';

/**
 * Send push notification via Firebase Cloud Messaging (FCM)
 * NO SMS - ONLY PUSH NOTIFICATIONS
 */
export async function sendNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string; reason?: string; error?: any }> {
  try {
    // Get user's FCM token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, name: true },
    });

    if (!user?.fcmToken) {
      logger.warn(`[Notifications] No FCM token for user ${userId}`);
      return { success: false, reason: 'no_token' };
    }

    // Get Firebase Messaging instance
    const messaging = getMessaging();

    if (!messaging) {
      logger.warn('[Notifications] Firebase not initialized');
      return { success: false, reason: 'firebase_not_initialized' };
    }

    // Build FCM message
    const message = {
      token: user.fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        action: payload.action || 'OPEN_APP',
        ...(payload.data
          ? Object.entries(payload.data).reduce(
              (acc, [key, value]) => ({
                ...acc,
                [key]: typeof value === 'string' ? value : JSON.stringify(value),
              }),
              {}
            )
          : {}),
      },
      android: {
        priority: (payload.priority || 'normal') as any,
        notification: {
          channelId: 'stash-default',
          sound: 'default',
          priority: (payload.priority || 'normal') as any,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Send notification
    const response = await messaging.send(message);

    logger.info(`[Notifications] Sent to ${userId}: ${response}`);

    // Log notification in database
    await prisma.notification.create({
      data: {
        userId,
        title: payload.title,
        body: payload.body,
        action: payload.action,
        data: payload.data as any,
      },
    });

    return { success: true, messageId: response };
  } catch (error: any) {
    logger.error(`[Notifications] Error sending to ${userId}:`, error);

    // If token is invalid, clear it from the database
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      logger.warn(`[Notifications] Clearing invalid FCM token for user ${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null },
      });
    }

    return { success: false, error };
  }
}

/**
 * Send batch notifications to multiple users
 */
export async function sendBatchNotifications(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ successCount: number; failureCount: number }> {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendNotification(userId, payload))
  );

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;
  const failureCount = results.length - successCount;

  logger.info(
    `[Notifications] Batch send complete: ${successCount} success, ${failureCount} failed`
  );

  return { successCount, failureCount };
}
