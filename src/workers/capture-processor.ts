import { captureQueue } from '../services/queue.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AgentCoordinator } from '../agents/coordinator.js';

// Initialize agent coordinator
const coordinator = new AgentCoordinator();

/**
 * Capture Processing Worker
 * Processes captures through the autonomous agent system
 */
captureQueue.process('process-capture', async (job) => {
  const { captureId, userId } = job.data;

  logger.info(`[Worker] Processing capture ${captureId} for user ${userId}`);

  try {
    // Update status
    await prisma.capture.update({
      where: { id: captureId },
      data: { processingStatus: 'PROCESSING' },
    });

    // Get capture
    const capture = await prisma.capture.findUnique({
      where: { id: captureId },
    });

    if (!capture) {
      throw new Error(`Capture ${captureId} not found`);
    }

    // Run through agent coordinator
    await coordinator.processCapture(capture, userId);

    logger.info(`[Worker] Successfully processed capture ${captureId}`);

    return { success: true, captureId };
  } catch (error: any) {
    logger.error(`[Worker] Error processing capture ${captureId}:`, error);

    await prisma.capture.update({
      where: { id: captureId },
      data: { processingStatus: 'FAILED' },
    });

    throw error; // Bull will retry
  }
});

// Event handlers
captureQueue.on('completed', (job, result) => {
  logger.info(`[Worker] Capture job ${job.id} completed:`, result);
});

captureQueue.on('failed', (job, err) => {
  logger.error(`[Worker] Capture job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err);
});

captureQueue.on('stalled', (job) => {
  logger.warn(`[Worker] Capture job ${job.id} stalled`);
});

logger.info('[Worker] Capture processor started');
