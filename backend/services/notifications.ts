import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotificationPayload } from '../types/api.js';

export async function sendNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string; reason?: string; error?: any }> {
  try {
    // Save notification as an Insight for in-app retrieval
    const insight = await prisma.insight.create({
      data: {
        userId,
        type: 'NOTIFICATION',
        title: payload.title,
        content: payload.body,
        metadata: {
          action: payload.action,
          data: payload.data,
          priority: payload.priority
        },
        isRead: false
      }
    });

    logger.info(`[Notifications] Saved Insight ${insight.id} for user ${userId}`);

    return { success: true, messageId: insight.id };
  } catch (error: any) {
    logger.error(`[Notifications] Error sending to ${userId}:`, error);
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
