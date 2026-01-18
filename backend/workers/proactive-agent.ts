import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { sendNotification } from '../services/notifications.js';
import { generateStructuredResponse } from '../services/ai.js';
import { listUpcomingEvents } from '../services/calendar.js';
import { config } from '../config/env.js';

/**
 * Proactive Agent Worker
 * Runs periodically to find opportunities to help users
 * - Morning Briefing (8am)
 * - Event Reminders (Hourly/30min)
 * - Weekly Suggestions (Sunday 6pm)
 */

// ==========================================
// 1. Morning Briefing (Daily 8am)
// ==========================================

async function generateMorningBriefing(userId: string) {
  try {
    logger.info(`[ProactiveAgent] Generating morning briefing for user ${userId}`);

    // Get recent captures (last 3 days)
    const recentCaptures = await prisma.capture.findMany({
      where: {
        userId,
        processingStatus: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get upcoming calendar events (next 24 hours)
    const upcomingEvents = await listUpcomingEvents(userId, 5);
    
    // Skip if no content
    if (recentCaptures.length === 0 && upcomingEvents.length === 0) {
      return;
    }

    const context = `
RECENT CAPTURES (Last 3 days):
${recentCaptures.map(c => `- ${c.metadata ? (c.metadata as any).title : 'Untitled'}: ${(c.metadata as any).description?.slice(0, 100)}`).join('\n')}

UPCOMING EVENTS (Next 24h):
${upcomingEvents.map(e => `- ${e.summary} at ${e.start?.dateTime || e.start?.date}`).join('\n')}
`;

    const systemPrompt = `You are a personal AI assistant. Generate a morning briefing.
Focus on:
1. Upcoming events/deadlines (today)
2. Important tasks or reminders from recent captures
3. Forgotten items that need attention

Return ONLY valid JSON:
{
  "summary": "Concise summary (3-5 bullet points)",
  "relatedCaptureIds": ["id1", "id2"]
}`;

    const briefing = await generateStructuredResponse<{
      summary: string;
      relatedCaptureIds: string[];
    }>(context, systemPrompt, userId);

    if (briefing.summary) {
       await sendNotification(userId, {
        title: '☀️ Good morning!',
        body: briefing.summary,
        action: 'MORNING_BRIEFING',
        data: {
          type: 'morning_briefing',
          captures: briefing.relatedCaptureIds,
        },
      });
      logger.info(`[ProactiveAgent] Sent morning briefing to user ${userId}`);
    }

  } catch (error) {
    logger.error(`[ProactiveAgent] Error generating briefing for user ${userId}:`, error);
  }
}

// ==========================================
// 2. Event-Based Reminders (Every 30 mins)
// ==========================================

async function checkEventReminders(userId: string) {
  try {
    // Check events starting in 30-60 minutes
    const events = await listUpcomingEvents(userId, 5);
    const now = new Date();
    const in30Mins = new Date(now.getTime() + 30 * 60 * 1000);
    const in60Mins = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingEvents = events.filter(event => {
      const startTime = new Date(event.start?.dateTime || event.start?.date);
      return startTime > in30Mins && startTime <= in60Mins;
    });

    for (const event of upcomingEvents) {
      logger.info(`[ProactiveAgent] Found upcoming event for user ${userId}: ${event.summary}`);

      // Find related captures (simple keyword search for now)
      // Ideally we would use vector search here
      const relatedCaptures = await prisma.capture.findMany({
        where: {
          userId,
          processingStatus: 'COMPLETED',
          OR: [
            {
              metadata: {
                path: ['title'],
                string_contains: event.summary,
              }
            },
            {
               content: {
                 contains: event.summary,
                 mode: 'insensitive'
               }
            }
          ]
        },
        take: 3
      });

      if (relatedCaptures.length > 0) {
        await sendNotification(userId, {
          title: `🔔 ${event.summary} in ~45 mins`,
          body: `I found ${relatedCaptures.length} related notes/captures. Tap to review.`,
          action: 'EVENT_REMINDER',
          data: {
            type: 'event_reminder',
            eventId: event.id,
            captureIds: relatedCaptures.map(c => c.id),
          },
        });
        logger.info(`[ProactiveAgent] Sent event reminder for ${event.summary}`);
      }
    }
  } catch (error) {
    // Only log error if it's not "No calendar token" which is expected for many users
    if ((error as any).message !== 'No calendar token found for user') {
      logger.error(`[ProactiveAgent] Error checking events for user ${userId}:`, error);
    }
  }
}

// ==========================================
// 3. Smart Suggestions (Weekly - Sunday 6pm)
// ==========================================

async function generateWeeklySuggestions(userId: string) {
  try {
    logger.info(`[ProactiveAgent] Generating weekly suggestions for user ${userId}`);

    // Get all recent activity (last 7 days)
    const recentCaptures = await prisma.capture.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      take: 50,
    });

    if (recentCaptures.length < 5) return; // Not enough data

    const context = `
USER ACTIVITY (Last 7 days):
${recentCaptures.map(c => `- [${c.type}] ${(c.metadata as any)?.title || 'Untitled'}: ${(c.metadata as any)?.topics?.join(', ')}`).join('\n')}
`;

    const systemPrompt = `Analyze the user's capture history and identify:
1. Recurring themes or interests
2. Incomplete tasks or goals
3. Connections between captures
4. Actionable suggestions

Return ONLY valid JSON:
{
  "insight": "One clear, helpful insight or suggestion (max 2 sentences)",
  "type": "pattern" | "cleanup" | "goal"
}`;

    const suggestion = await generateStructuredResponse<{
      insight: string;
      type: string;
    }>(context, systemPrompt, userId);

    if (suggestion.insight) {
      await sendNotification(userId, {
        title: '💡 Weekly Insight',
        body: suggestion.insight,
        action: 'SMART_SUGGESTION',
        data: {
          type: 'smart_suggestion',
          suggestionType: suggestion.type
        },
      });
      logger.info(`[ProactiveAgent] Sent weekly suggestion to user ${userId}`);
    }

  } catch (error) {
    logger.error(`[ProactiveAgent] Error generating weekly suggestions for user ${userId}:`, error);
  }
}

// ==========================================
// Main Scheduler
// ==========================================

async function getActiveUsers() {
   return await prisma.user.findMany({
        where: {
          captures: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
        select: { id: true },
    });
}

export function startProactiveAgent() {
  if (!config.agent.enableProactiveAgent) {
    logger.info('[ProactiveAgent] Proactive agent disabled in config');
    return;
  }

  logger.info('[ProactiveAgent] Starting scheduled jobs...');

  // 1. Morning Briefing: Daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('[ProactiveAgent] ☀️ Starting Morning Briefing job');
    const users = await getActiveUsers();
    for (const user of users) {
      await generateMorningBriefing(user.id);
      await new Promise(r => setTimeout(r, 2000)); // Rate limiting
    }
  });

  // 2. Event Reminders: Every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    // logger.info('[ProactiveAgent] 🔔 Starting Event Reminder check');
    const users = await getActiveUsers();
    for (const user of users) {
      await checkEventReminders(user.id);
      await new Promise(r => setTimeout(r, 1000));
    }
  });

  // 3. Weekly Suggestions: Sunday at 6:00 PM
  cron.schedule('0 18 * * 0', async () => {
    logger.info('[ProactiveAgent] 💡 Starting Weekly Suggestions job');
    const users = await getActiveUsers();
    for (const user of users) {
      await generateWeeklySuggestions(user.id);
      await new Promise(r => setTimeout(r, 2000));
    }
  });

  logger.info('[ProactiveAgent] Scheduler active: Morning (8am), Events (30m), Weekly (Sun 6pm)');
}