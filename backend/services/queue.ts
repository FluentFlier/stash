import Queue from 'bull';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ============================================
// Queue Definitions
// ============================================

export const captureQueue = new Queue('capture-processing', config.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

export const reminderQueue = new Queue('reminder-sending', config.redis.url, {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const proactiveQueue = new Queue('proactive-agent', config.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export const patternLearningQueue = new Queue('pattern-learning', config.redis.url, {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,
    },
  },
});

// ============================================
// Queue Event Handlers
// ============================================

captureQueue.on('completed', (job, result) => {
  logger.info(`[Queue] Capture job ${job.id} completed:`, result);
});

captureQueue.on('failed', (job, err) => {
  logger.error(`[Queue] Capture job ${job?.id} failed:`, err.message);
});

captureQueue.on('error', (error) => {
  logger.error('[Queue] Capture queue error:', error);
});

reminderQueue.on('completed', (job, result) => {
  logger.info(`[Queue] Reminder job ${job.id} completed:`, result);
});

reminderQueue.on('failed', (job, err) => {
  logger.error(`[Queue] Reminder job ${job?.id} failed:`, err.message);
});

proactiveQueue.on('completed', (job, result) => {
  logger.info(`[Queue] Proactive agent job ${job.id} completed:`, result);
});

proactiveQueue.on('failed', (job, err) => {
  logger.error(`[Queue] Proactive agent job ${job?.id} failed:`, err.message);
});

patternLearningQueue.on('completed', (job, result) => {
  logger.info(`[Queue] Pattern learning job ${job.id} completed:`, result);
});

patternLearningQueue.on('failed', (job, err) => {
  logger.error(`[Queue] Pattern learning job ${job?.id} failed:`, err.message);
});

// ============================================
// Queue Helpers
// ============================================

export async function addCaptureJob(captureId: string, userId: string) {
  return captureQueue.add(
    'process-capture',
    { captureId, userId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
}

export async function addReminderJob(reminderId: string, scheduledAt: Date) {
  const delay = scheduledAt.getTime() - Date.now();

  if (delay < 0) {
    logger.warn(`[Queue] Reminder ${reminderId} is in the past, sending immediately`);
  }

  return reminderQueue.add(
    'send-reminder',
    { reminderId },
    {
      delay: Math.max(0, delay),
      attempts: 5,
    }
  );
}

export async function addProactiveJob(userId: string, type: string, data: any) {
  return proactiveQueue.add(
    'proactive-action',
    { userId, type, data },
    {
      attempts: 3,
    }
  );
}

export async function addPatternLearningJob(userId: string, captureId: string) {
  return patternLearningQueue.add(
    'learn-patterns',
    { userId, captureId },
    {
      attempts: 2,
      delay: 5000, // Wait 5 seconds before learning
    }
  );
}

// ============================================
// Graceful Shutdown
// ============================================

process.on('beforeExit', async () => {
  logger.info('[Queue] Closing all queues...');
  await Promise.all([
    captureQueue.close(),
    reminderQueue.close(),
    proactiveQueue.close(),
    patternLearningQueue.close(),
  ]);
  logger.info('[Queue] All queues closed');
});
