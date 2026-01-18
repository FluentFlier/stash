import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotificationPayload } from '../types/api.js';

export async function sendNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string; reason?: string; error?: any }> {
  try {
    // Get user's FCM token just to check logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, name: true },
    });

    if (!user?.fcmToken) {
      logger.warn(`[Notifications] No FCM token for user ${userId} (simulated)`);
    }

    logger.info(`[Notifications] (MOCK) Sent to ${userId}: ${payload.title} - ${payload.body}`);

    return { success: true, messageId: 'mock-id-' + Date.now() };
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
