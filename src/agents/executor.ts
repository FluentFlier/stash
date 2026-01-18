import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ActionPlan, ExecutionResult } from '../types/agents.js';
import { sendNotification } from '../services/notifications.js';
import { addReminderJob } from '../services/queue.js';
import { createCalendarEvent } from '../services/calendar.js';
import { summarizeContent } from '../services/ai.js';

/**
 * Executor Agent
 * Executes actions from the action plan
 */
export class ExecutorAgent {
  /**
   * Execute all actions in the plan
   */
  async execute(plan: ActionPlan, userId: string): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    logger.info(`[ExecutorAgent] Executing ${plan.actions.length} actions`);

    // Sort actions by priority (highest first)
    const sortedActions = [...plan.actions].sort((a, b) => b.priority - a.priority);

    for (const action of sortedActions) {
      try {
        logger.info(`[ExecutorAgent] Executing action: ${action.type}`);

        let result: ExecutionResult;

        switch (action.type) {
          case 'ADD_TO_COLLECTION':
            result = await this.executeAddToCollection(action.data, plan.captureId, userId);
            break;

          case 'CREATE_REMINDER':
            result = await this.executeCreateReminder(action.data, plan.captureId, userId);
            break;

          case 'ADD_TAG':
            result = await this.executeAddTag(action.data, plan.captureId, userId);
            break;

          case 'CREATE_CALENDAR_EVENT':
            result = await this.executeCreateCalendarEvent(action.data, userId);
            break;

          case 'NOTIFY':
            result = await this.executeNotify(action.data, userId);
            break;

          case 'SUMMARIZE':
            result = await this.executeSummarize(action.data, plan.captureId, userId);
            break;

          case 'EXTRACT_ENTITIES':
            result = await this.executeExtractEntities(action.data, plan.captureId);
            break;

          default:
            result = {
              action: action.type,
              success: false,
              error: 'Unknown action type',
            };
        }

        results.push(result);
      } catch (error: any) {
        logger.error(`[ExecutorAgent] Error executing ${action.type}:`, error);
        results.push({
          action: action.type,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(`[ExecutorAgent] Execution complete: ${successCount}/${results.length} successful`);

    return results;
  }

  /**
   * Add capture to a collection
   */
  private async executeAddToCollection(
    data: any,
    captureId: string,
    userId: string
  ): Promise<ExecutionResult> {
    try {
      const collectionName = data.collection;

      // Find or create collection
      let collection = await prisma.collection.findFirst({
        where: { userId, name: collectionName },
      });

      if (!collection) {
        collection = await prisma.collection.create({
          data: {
            userId,
            name: collectionName,
            type: 'SMART', // Agent-created collections are smart
          },
        });
      }

      // Add capture to collection
      await prisma.collectionCapture.create({
        data: {
          collectionId: collection.id,
          captureId,
          addedBy: 'agent',
        },
      });

      return {
        action: 'ADD_TO_COLLECTION',
        success: true,
        data: { collectionId: collection.id, collectionName },
      };
    } catch (error: any) {
      return {
        action: 'ADD_TO_COLLECTION',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a reminder
   */
  private async executeCreateReminder(
    data: any,
    captureId: string,
    userId: string
  ): Promise<ExecutionResult> {
    try {
      const scheduledAt = new Date(data.scheduledAt);

      const reminder = await prisma.reminder.create({
        data: {
          userId,
          captureId,
          message: data.message,
          scheduledAt,
          status: 'PENDING',
        },
      });

      // Add to reminder queue
      await addReminderJob(reminder.id, scheduledAt);

      return {
        action: 'CREATE_REMINDER',
        success: true,
        data: { reminderId: reminder.id },
      };
    } catch (error: any) {
      return {
        action: 'CREATE_REMINDER',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Add tags to capture
   */
  private async executeAddTag(
    data: any,
    captureId: string,
    userId: string
  ): Promise<ExecutionResult> {
    try {
      const tags = data.tags as string[];

      for (const tagName of tags) {
        // Find or create tag
        let tag = await prisma.tag.findFirst({
          where: { userId, name: tagName },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: { userId, name: tagName },
          });
        }

        // Add tag to capture (skip if already exists)
        await prisma.captureTag.upsert({
          where: {
            captureId_tagId: {
              captureId,
              tagId: tag.id,
            },
          },
          create: {
            captureId,
            tagId: tag.id,
          },
          update: {},
        });
      }

      return {
        action: 'ADD_TAG',
        success: true,
        data: { tags },
      };
    } catch (error: any) {
      return {
        action: 'ADD_TAG',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create calendar event
   */
  private async executeCreateCalendarEvent(data: any, userId: string): Promise<ExecutionResult> {
    try {
      const event = await createCalendarEvent(userId, data);

      return {
        action: 'CREATE_CALENDAR_EVENT',
        success: true,
        data: { eventId: event.id },
      };
    } catch (error: any) {
      return {
        action: 'CREATE_CALENDAR_EVENT',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send push notification
   */
  private async executeNotify(data: any, userId: string): Promise<ExecutionResult> {
    try {
      const result = await sendNotification(userId, {
        title: data.title,
        body: data.body,
        action: data.action,
        data: data.data,
        priority: data.priority || 'normal',
      });

      return {
        action: 'NOTIFY',
        success: result.success,
        data: result,
      };
    } catch (error: any) {
      return {
        action: 'NOTIFY',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create summary
   */
  private async executeSummarize(
    data: any,
    captureId: string,
    userId: string
  ): Promise<ExecutionResult> {
    try {
      const capture = await prisma.capture.findUnique({
        where: { id: captureId },
      });

      if (!capture || !capture.fullContent) {
        throw new Error('Capture not found or has no content');
      }

      const summary = await summarizeContent(capture.fullContent, userId, data.maxLength || 200);

      // Store summary in metadata
      await prisma.capture.update({
        where: { id: captureId },
        data: {
          metadata: {
            ...(capture.metadata as object),
            summary,
          },
        },
      });

      return {
        action: 'SUMMARIZE',
        success: true,
        data: { summary },
      };
    } catch (error: any) {
      return {
        action: 'SUMMARIZE',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract and save entities
   */
  private async executeExtractEntities(_data: any, _captureId: string): Promise<ExecutionResult> {
    try {
      // Entities are already extracted during analysis
      // This is a placeholder for future entity-specific actions

      return {
        action: 'EXTRACT_ENTITIES',
        success: true,
        data: {},
      };
    } catch (error: any) {
      return {
        action: 'EXTRACT_ENTITIES',
        success: false,
        error: error.message,
      };
    }
  }
}
