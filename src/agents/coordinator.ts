import { Capture } from '@prisma/client';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AnalyzerAgent } from './analyzer.js';
import { PlannerAgent } from './planner.js';
import { ExecutorAgent } from './executor.js';
import { LearnerAgent } from './learner.js';
import { sendNotification } from '../services/notifications.js';

/**
 * Agent Coordinator
 * Orchestrates all agents to process captures autonomously
 */
export class AgentCoordinator {
  private analyzer: AnalyzerAgent;
  private planner: PlannerAgent;
  private executor: ExecutorAgent;
  private learner: LearnerAgent;

  constructor() {
    this.analyzer = new AnalyzerAgent();
    this.planner = new PlannerAgent();
    this.executor = new ExecutorAgent();
    this.learner = new LearnerAgent();
  }

  /**
   * Main orchestration method - coordinates all agents
   * This is the autonomous AI system in action!
   */
  async processCapture(capture: Capture, userId: string) {
    try {
      logger.info('');
      logger.info('🤖 ============================================');
      logger.info(`🤖 AUTONOMOUS AGENT PROCESSING: ${capture.id}`);
      logger.info('🤖 ============================================');
      logger.info('');

      // Step 1: Deep Analysis
      logger.info('🔍 [STEP 1/6] ANALYZER AGENT - Deep Content Analysis');
      const analysis = await this.analyzer.analyze(capture, userId);
      logger.info(`✅ Analysis complete: ${analysis.contentAnalysis.topics.length} topics, ${analysis.relatedCount} related items`);
      logger.info('');

      // Step 2: Create Action Plan
      logger.info('📋 [STEP 2/6] PLANNER AGENT - Creating Action Plan');
      const plan = await this.planner.createPlan(analysis, userId);
      plan.captureId = capture.id; // Set capture ID
      logger.info(`✅ Plan created: ${plan.actions.length} actions, confidence: ${(plan.confidence * 100).toFixed(0)}%`);
      logger.info(`   Actions: ${plan.actions.map((a) => a.type).join(', ')}`);
      logger.info(`   Reasoning: ${plan.reasoning}`);
      logger.info('');

      // Step 3: Execute Actions
      logger.info('⚡ [STEP 3/6] EXECUTOR AGENT - Executing Actions');
      const results = await this.executor.execute(plan, userId);
      const successCount = results.filter((r) => r.success).length;
      logger.info(`✅ Execution complete: ${successCount}/${results.length} successful`);
      results.forEach((result) => {
        const status = result.success ? '✅' : '❌';
        logger.info(`   ${status} ${result.action}: ${result.success ? 'Success' : result.error}`);
      });
      logger.info('');

      // Step 4: Learn from Outcome
      logger.info('🧠 [STEP 4/6] LEARNER AGENT - Recording Outcome');
      await this.learner.recordOutcome(capture.id, plan, results, userId);
      logger.info('✅ Outcome recorded for pattern learning');
      logger.info('');

      // Step 5: Update Capture
      logger.info('💾 [STEP 5/6] UPDATING DATABASE');
      await prisma.capture.update({
        where: { id: capture.id },
        data: {
          analysis: analysis.contentAnalysis as any,
          actionPlan: plan as any,
          actionResults: results as any,
          fullContent: analysis.contentAnalysis.fullContent,
          metadata: {
            title: analysis.contentAnalysis.title,
            description: analysis.contentAnalysis.description,
            topics: analysis.contentAnalysis.topics,
            entities: analysis.contentAnalysis.entities,
            keyTakeaways: analysis.contentAnalysis.keyTakeaways,
            actionItems: analysis.contentAnalysis.actionItems,
            intent: analysis.intent,
            relatedCount: analysis.relatedCount,
          },
          processingStatus: 'COMPLETED',
        },
      });
      logger.info('✅ Capture updated with analysis and results');
      logger.info('');

      // Step 6: Send Smart Notification
      logger.info('📱 [STEP 6/6] SENDING NOTIFICATION');
      await this.sendSmartNotification(userId, analysis, plan, results);
      logger.info('✅ Notification sent');
      logger.info('');

      logger.info('🤖 ============================================');
      logger.info('🤖 AUTONOMOUS PROCESSING COMPLETE ✅');
      logger.info('🤖 ============================================');
      logger.info('');

      return { success: true, analysis, plan, results };
    } catch (error: any) {
      logger.error('');
      logger.error('🤖 ============================================');
      logger.error(`🤖 ERROR PROCESSING CAPTURE: ${capture.id}`);
      logger.error('🤖 ============================================');
      logger.error(error);
      logger.error('');

      await prisma.capture.update({
        where: { id: capture.id },
        data: { processingStatus: 'FAILED' },
      });

      throw error;
    }
  }

  /**
   * Send a smart notification based on what happened
   */
  private async sendSmartNotification(
    userId: string,
    analysis: any,
    plan: any,
    results: any[]
  ): Promise<void> {
    try {
      const successfulActions = results.filter((r) => r.success);

      // Build notification body
      let body = '';

      // Check for specific actions
      const addedToCollection = successfulActions.find((r) => r.action === 'ADD_TO_COLLECTION');
      const createdReminder = successfulActions.find((r) => r.action === 'CREATE_REMINDER');
      const addedTags = successfulActions.find((r) => r.action === 'ADD_TAG');

      if (addedToCollection) {
        body += `Added to ${addedToCollection.data.collectionName}. `;
      }

      if (createdReminder) {
        body += `Reminder set. `;
      }

      if (addedTags && addedTags.data.tags) {
        body += `Tagged: ${addedTags.data.tags.slice(0, 2).join(', ')}. `;
      }

      if (analysis.relatedCount > 0) {
        body += `Found ${analysis.relatedCount} related items.`;
      }

      if (!body) {
        body = `Saved: ${analysis.contentAnalysis.title}`;
      }

      // Send notification (but don't fail if it doesn't work)
      await sendNotification(userId, {
        title: '✅ Stash saved',
        body: body.trim(),
        action: 'OPEN_CAPTURE',
        data: { captureId: plan.captureId },
        priority: 'normal',
      });
    } catch (error) {
      logger.error('[Coordinator] Error sending notification:', error);
      // Don't throw - notification failure shouldn't fail the whole process
    }
  }
}
