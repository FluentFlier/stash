import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ActionPlan, ExecutionResult } from '../types/agents.js';

/**
 * Learner Agent
 * Learns from user patterns and action outcomes
 */
export class LearnerAgent {
  /**
   * Record action outcome for learning
   */
  async recordOutcome(
    captureId: string,
    plan: ActionPlan,
    results: ExecutionResult[],
    userId: string
  ): Promise<void> {
    try {
      logger.info(`[LearnerAgent] Recording outcome for capture ${captureId}`);

      // Store outcome
      await prisma.actionOutcome.create({
        data: {
          userId,
          captureId,
          plan: plan as any,
          results: results as any,
        },
      });

      // Learn patterns asynchronously
      this.learnPatterns(userId).catch((error) => {
        logger.error('[LearnerAgent] Error learning patterns:', error);
      });
    } catch (error) {
      logger.error('[LearnerAgent] Error recording outcome:', error);
    }
  }

  /**
   * Learn patterns from user behavior
   */
  private async learnPatterns(userId: string): Promise<void> {
    try {
      logger.info(`[LearnerAgent] Learning patterns for user ${userId}`);

      // Get recent outcomes
      const recentOutcomes = await prisma.actionOutcome.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      if (recentOutcomes.length < 5) {
        logger.info('[LearnerAgent] Not enough data to learn patterns');
        return;
      }

      // Learn save time patterns
      await this.learnSaveTimePattern(userId, recentOutcomes);

      // Learn content preference patterns
      await this.learnContentPreferences(userId, recentOutcomes);

      // Learn notification timing patterns
      await this.learnNotificationTiming(userId, recentOutcomes);

      logger.info('[LearnerAgent] Pattern learning complete');
    } catch (error) {
      logger.error('[LearnerAgent] Error in pattern learning:', error);
    }
  }

  /**
   * Learn when user typically saves content
   */
  private async learnSaveTimePattern(userId: string, outcomes: any[]): Promise<void> {
    try {
      const saveTimes = outcomes.map((o) => new Date(o.timestamp).getHours());

      // Calculate most common hours
      const hourCounts: Record<number, number> = {};
      saveTimes.forEach((hour) => {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const mostCommonHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      // Calculate day of week pattern
      const dayOfWeekCounts: Record<number, number> = {};
      outcomes.forEach((o) => {
        const day = new Date(o.timestamp).getDay();
        dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
      });

      const confidence = mostCommonHours.length > 0 ? 0.7 : 0.3;

      await prisma.userPattern.upsert({
        where: {
          userId_patternType: {
            userId,
            patternType: 'save_time',
          },
        },
        create: {
          userId,
          patternType: 'save_time',
          data: {
            mostCommonHours,
            dayOfWeekCounts,
          },
          confidence,
        },
        update: {
          data: {
            mostCommonHours,
            dayOfWeekCounts,
          },
          confidence,
        },
      });

      logger.info(`[LearnerAgent] Learned save time pattern: ${mostCommonHours.join(', ')}:00`);
    } catch (error) {
      logger.error('[LearnerAgent] Error learning save time pattern:', error);
    }
  }

  /**
   * Learn content preferences (topics, types, sources)
   */
  private async learnContentPreferences(userId: string, outcomes: any[]): Promise<void> {
    try {
      // Get all captures with analysis
      const captures = await prisma.capture.findMany({
        where: {
          userId,
          processingStatus: 'COMPLETED',
          actionOutcomes: {
            some: {},
          },
        },
        select: {
          type: true,
          analysis: true,
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      });

      // Count content types
      const typeCounts: Record<string, number> = {};
      captures.forEach((c) => {
        typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
      });

      // Extract topics
      const allTopics: string[] = [];
      captures.forEach((c) => {
        const analysis = c.analysis as any;
        if (analysis?.topics) {
          allTopics.push(...analysis.topics);
        }
      });

      // Count topic frequency
      const topicCounts: Record<string, number> = {};
      allTopics.forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });

      const topTopics = Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));

      const confidence = captures.length > 20 ? 0.8 : 0.5;

      await prisma.userPattern.upsert({
        where: {
          userId_patternType: {
            userId,
            patternType: 'content_preference',
          },
        },
        create: {
          userId,
          patternType: 'content_preference',
          data: {
            typeCounts,
            topTopics,
          },
          confidence,
        },
        update: {
          data: {
            typeCounts,
            topTopics,
          },
          confidence,
        },
      });

      logger.info(`[LearnerAgent] Learned content preferences: ${topTopics.map((t) => t.topic).join(', ')}`);
    } catch (error) {
      logger.error('[LearnerAgent] Error learning content preferences:', error);
    }
  }

  /**
   * Learn optimal notification timing
   */
  private async learnNotificationTiming(userId: string, outcomes: any[]): Promise<void> {
    try {
      // Get notification interactions from the database
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        take: 100,
      });

      // Calculate read times (hour of day when user reads notifications)
      const readHours: number[] = [];
      notifications.forEach((n) => {
        if (n.readAt) {
          readHours.push(new Date(n.readAt).getHours());
        }
      });

      if (readHours.length < 5) {
        return; // Not enough data
      }

      // Calculate most common read hours
      const hourCounts: Record<number, number> = {};
      readHours.forEach((hour) => {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const bestHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      const confidence = readHours.length > 20 ? 0.8 : 0.5;

      await prisma.userPattern.upsert({
        where: {
          userId_patternType: {
            userId,
            patternType: 'notification_timing',
          },
        },
        create: {
          userId,
          patternType: 'notification_timing',
          data: {
            bestHours,
            totalNotifications: notifications.length,
            readRate: readHours.length / notifications.length,
          },
          confidence,
        },
        update: {
          data: {
            bestHours,
            totalNotifications: notifications.length,
            readRate: readHours.length / notifications.length,
          },
          confidence,
        },
      });

      logger.info(`[LearnerAgent] Learned notification timing: ${bestHours.join(', ')}:00`);
    } catch (error) {
      logger.error('[LearnerAgent] Error learning notification timing:', error);
    }
  }
}
