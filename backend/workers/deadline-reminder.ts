import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { getUpcomingDeadlines, isSupermemoryConfigured } from '../services/supermemory.js';
import { isDeadlineApproaching } from '../services/deadline-extractor.js';
import { sendNotification } from '../services/notifications.js';

// ============================================
// Deadline Reminder Worker
// ============================================

// Track sent reminders to avoid duplicates (in-memory for now)
// In production, use Redis or database
const sentReminders = new Set<string>();

/**
 * Check deadlines for a single user and send notifications
 */
async function checkUserDeadlines(userId: string): Promise<number> {
    try {
        const deadlines = await getUpcomingDeadlines(userId, 7);
        let notificationsSent = 0;

        for (const memory of deadlines) {
            if (!memory.metadata?.deadline) continue;

            const deadline = memory.metadata.deadline;
            const captureId = memory.metadata.stashCaptureId as string | undefined;
            const reminderKey = `${userId}:${memory.id}:${deadline}`;

            // Skip if already reminded
            if (sentReminders.has(reminderKey)) continue;

            // Check if deadline is approaching (within 24 hours)
            if (isDeadlineApproaching(deadline, 24)) {
                const hoursLeft = Math.round(
                    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60)
                );

                await sendNotification(userId, {
                    title: '⏰ Deadline Approaching',
                    body: `${memory.metadata.title || 'Item'} - ${memory.metadata.deadlineDescription || 'Due soon'} (${hoursLeft}h left)`,
                    action: captureId ? 'OPEN_CAPTURE' : undefined,
                    data: captureId ? { captureId } : undefined,
                    priority: hoursLeft < 6 ? 'high' : 'normal',
                });

                sentReminders.add(reminderKey);
                notificationsSent++;

                logger.info(
                    `[DeadlineReminder] Sent reminder to user ${userId}: ${memory.metadata.title} (${hoursLeft}h left)`
                );
            }
        }

        return notificationsSent;
    } catch (error: any) {
        logger.error(`[DeadlineReminder] Error checking deadlines for user ${userId}:`, error);
        return 0;
    }
}

/**
 * Main deadline check job - runs for all users
 */
async function runDeadlineCheck(): Promise<void> {
    if (!isSupermemoryConfigured()) {
        logger.warn('[DeadlineReminder] Supermemory not configured, skipping deadline check');
        return;
    }

    logger.info('[DeadlineReminder] Starting deadline check...');

    try {
        // Get all users with notifications enabled
        const users = await prisma.user.findMany({
            where: {
                notificationsEnabled: true,
            },
            select: {
                id: true,
            },
        });

        let totalNotifications = 0;

        for (const user of users) {
            const count = await checkUserDeadlines(user.id);
            totalNotifications += count;
        }

        logger.info(
            `[DeadlineReminder] Check complete. Sent ${totalNotifications} reminders to ${users.length} users.`
        );
    } catch (error: any) {
        logger.error('[DeadlineReminder] Error running deadline check:', error);
    }
}

/**
 * Start the deadline reminder worker
 * Runs every 6 hours by default
 */
export function startDeadlineReminderWorker(cronSchedule: string = '0 */6 * * *'): void {
    if (!isSupermemoryConfigured()) {
        logger.warn('[DeadlineReminder] Supermemory not configured, worker disabled');
        return;
    }

    logger.info(`[DeadlineReminder] Starting worker with schedule: ${cronSchedule}`);

    // Schedule cron job
    cron.schedule(cronSchedule, async () => {
        logger.info('[DeadlineReminder] Cron triggered');
        await runDeadlineCheck();
    });

    // Also run immediately on startup
    setTimeout(async () => {
        logger.info('[DeadlineReminder] Running initial check...');
        await runDeadlineCheck();
    }, 5000);

    logger.info('[DeadlineReminder] Worker started successfully');
}

/**
 * Manually trigger a deadline check (for testing)
 */
export async function triggerDeadlineCheck(): Promise<void> {
    await runDeadlineCheck();
}

/**
 * Clear sent reminders cache (for testing)
 */
export function clearReminderCache(): void {
    sentReminders.clear();
    logger.info('[DeadlineReminder] Reminder cache cleared');
}
