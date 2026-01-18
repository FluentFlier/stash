import { reminderQueue } from './worker-queues.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { sendNotification } from '../services/notifications.js';

/**
 * Reminder Sender Worker
 * Sends scheduled reminders to users
 */
reminderQueue.process('send-reminder', async (job) => {
  const { reminderId } = job.data;

  logger.info(`[Worker] Sending reminder ${reminderId}`);

  try {
    // Get reminder
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        capture: {
          select: {
            id: true,
            metadata: true,
          },
        },
      },
    });

    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }

    if (reminder.status !== 'PENDING') {
      logger.warn(`[Worker] Reminder ${reminderId} is not pending (status: ${reminder.status})`);
      return { success: false, reason: 'not_pending' };
    }

    // Send notification

    await sendNotification(reminder.userId, {
      title: '⏰ Reminder',
      body: reminder.message,
      action: 'OPEN_CAPTURE',
      data: {
        reminderId: reminder.id,
        captureId: reminder.captureId,
      },
      priority: 'high',
    });

    // Update reminder status
    await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    logger.info(`[Worker] Reminder ${reminderId} sent successfully`);

    return { success: true, reminderId };
  } catch (error: any) {
    logger.error(`[Worker] Error sending reminder ${reminderId}:`, error);
    throw error;
  }
});

// Event handlers
reminderQueue.on('completed', (job, result) => {
  logger.info(`[Worker] Reminder job ${job.id} completed:`, result);
});

reminderQueue.on('failed', (job, err) => {
  logger.error(`[Worker] Reminder job ${job?.id} failed:`, err);
});

logger.info('[Worker] Reminder sender started');
