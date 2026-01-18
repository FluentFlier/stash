import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { syncCalendarEventsToReminders } from '../services/calendar.js';

/**
 * Calendar Sync Worker
 * Periodically syncs Google Calendar events to reminders
 */

/**
 * Sync calendar events for a user
 */
async function syncUserCalendar(userId: string): Promise<void> {
  try {
    logger.info(`[CalendarSync] Syncing calendar for user ${userId}`);

    const stats = await syncCalendarEventsToReminders(userId);

    logger.info(
      `[CalendarSync] Sync complete for user ${userId}: ${stats.created} created, ${stats.updated} updated, ${stats.errors} errors`
    );
  } catch (error: any) {
    // Log error but don't throw - continue with other users
    logger.error(`[CalendarSync] Error syncing calendar for user ${userId}:`, error);
  }
}

/**
 * Start calendar sync cron job
 */
export function startCalendarSync() {
  // Run every 15 minutes
  const cronSchedule = '*/15 * * * *';

  cron.schedule(cronSchedule, async () => {
    try {
      logger.info('[CalendarSync] Running scheduled calendar sync');

      // Get all users with connected Google Calendar
      const usersWithCalendar = await prisma.calendarToken.findMany({
        where: {
          provider: 'google',
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      logger.info(`[CalendarSync] Found ${usersWithCalendar.length} users with connected calendar`);

      // Sync for each user (in batches to avoid overwhelming the system)
      const batchSize = 5;
      for (let i = 0; i < usersWithCalendar.length; i += batchSize) {
        const batch = usersWithCalendar.slice(i, i + batchSize);
        await Promise.all(batch.map((token) => syncUserCalendar(token.userId)));

        // Wait a bit between batches
        if (i + batchSize < usersWithCalendar.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      logger.info('[CalendarSync] Scheduled sync complete');
    } catch (error) {
      logger.error('[CalendarSync] Error in scheduled sync:', error);
    }
  });

  logger.info('[CalendarSync] Started with 15-minute interval');
}
