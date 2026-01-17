import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { sendNotification } from '../services/notifications.js';
import { generateStructuredResponse } from '../services/ai.js';
import { config } from '../config/env.js';

/**
 * Proactive Agent Worker
 * Runs periodically to find opportunities to help users
 */

/**
 * Run proactive analysis for a user
 */
async function runProactiveAnalysis(userId: string): Promise<void> {
  try {
    logger.info(`[ProactiveAgent] Running analysis for user ${userId}`);

    // Get user's recent captures
    const recentCaptures = await prisma.capture.findMany({
      where: {
        userId,
        processingStatus: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (recentCaptures.length === 0) {
      logger.info(`[ProactiveAgent] No recent captures for user ${userId}`);
      return;
    }

    // Get user patterns
    const patterns = await prisma.userPattern.findMany({
      where: { userId },
    });

    // Analyze for proactive suggestions
    const context = buildProactiveContext(recentCaptures, patterns);

    const systemPrompt = `You are a proactive AI assistant. Analyze the user's recent activity and patterns.
Suggest helpful actions if you find opportunities, otherwise return null.

Return ONLY valid JSON:
{
  "suggestion": {
    "type": "reminder" | "collection" | "summary" | "pattern_insight" | null,
    "title": "string",
    "message": "string",
    "data": {}
  }
}`;

    const result = await generateStructuredResponse<{
      suggestion: {
        type: string | null;
        title: string;
        message: string;
        data: any;
      } | null;
    }>(context, systemPrompt, userId);

    // If there's a suggestion, send it
    if (result.suggestion && result.suggestion.type) {
      await sendNotification(userId, {
        title: result.suggestion.title,
        body: result.suggestion.message,
        action: 'PROACTIVE_SUGGESTION',
        data: result.suggestion.data,
      });

      logger.info(`[ProactiveAgent] Sent proactive suggestion to user ${userId}: ${result.suggestion.type}`);
    } else {
      logger.info(`[ProactiveAgent] No suggestions for user ${userId}`);
    }
  } catch (error) {
    logger.error(`[ProactiveAgent] Error running analysis for user ${userId}:`, error);
  }
}

/**
 * Build context for proactive analysis
 */
function buildProactiveContext(captures: any[], patterns: any[]): string {
  const topicCounts: Record<string, number> = {};

  captures.forEach((capture) => {
    const analysis = capture.analysis as any;
    if (analysis?.topics) {
      analysis.topics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
  });

  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return `
RECENT ACTIVITY:
- ${captures.length} captures in the last 7 days
- Top topics: ${topTopics.map(([topic, count]) => `${topic} (${count})`).join(', ')}

USER PATTERNS:
${patterns.map((p) => `- ${p.patternType}: confidence ${(p.confidence * 100).toFixed(0)}%`).join('\n')}

Analyze this activity and suggest ONE helpful action if appropriate.
Examples:
- "You've saved 5 articles about React but haven't reviewed them"
- "You have similar content that could be organized into a collection"
- "Pattern detected: You save ML content on weekends"
`;
}

/**
 * Start proactive agent cron job
 */
export function startProactiveAgent() {
  if (!config.agent.enableProactiveAgent) {
    logger.info('[ProactiveAgent] Proactive agent disabled in config');
    return;
  }

  const intervalHours = config.agent.proactiveAgentIntervalHours;

  // Run every N hours
  const cronSchedule = `0 */${intervalHours} * * *`;

  cron.schedule(cronSchedule, async () => {
    try {
      logger.info('[ProactiveAgent] Running scheduled proactive analysis');

      // Get all active users (users who have saved something in the last 30 days)
      const activeUsers = await prisma.user.findMany({
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

      logger.info(`[ProactiveAgent] Found ${activeUsers.length} active users`);

      // Run analysis for each user (in batches to avoid overwhelming the system)
      const batchSize = 5;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const batch = activeUsers.slice(i, i + batchSize);
        await Promise.all(batch.map((user) => runProactiveAnalysis(user.id)));

        // Wait a bit between batches
        if (i + batchSize < activeUsers.length) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      logger.info('[ProactiveAgent] Scheduled analysis complete');
    } catch (error) {
      logger.error('[ProactiveAgent] Error in scheduled analysis:', error);
    }
  });

  logger.info(`[ProactiveAgent] Started with ${intervalHours}h interval`);
}
