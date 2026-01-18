import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';
import { AgentCoordinator } from '../agents/coordinator.js';

// ============================================
// Queue Stubs (Lazy initialization)
// ============================================
// Queues only connect when actually used, preventing startup crashes

const REDIS_URL = config.redis?.url;

// Queue instances (created lazily)
let _captureQueue: any = null;
let _reminderQueue: any = null;
let _proactiveQueue: any = null;
let _patternLearningQueue: any = null;

// Agent coordinator for direct processing fallback
let _coordinator: AgentCoordinator | null = null;

function getCoordinator() {
  if (!_coordinator) {
    _coordinator = new AgentCoordinator();
  }
  return _coordinator;
}

async function getQueue(name: string, existingQueue: any, setQueue: (q: any) => void) {
  if (!REDIS_URL) {
    logger.warn(`[Queue] REDIS_URL not configured - ${name} queue disabled`);
    return null;
  }

  if (existingQueue) return existingQueue;

  try {
    const Queue = (await import('bull')).default;
    const queue = new Queue(name, REDIS_URL, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
    setQueue(queue);
    return queue;
  } catch (error) {
    logger.error(`[Queue] Failed to create ${name} queue:`, error);
    return null;
  }
}

// ============================================
// Queue Helpers
// ============================================

export async function addCaptureJob(captureId: string, userId: string) {
  const queue = await getQueue('capture-processing', _captureQueue, (q) => _captureQueue = q);

  if (!queue) {
    logger.info(`[Queue] Capture ${captureId} - processing directly (no Redis)`);

    // Direct processing fallback (async but not awaited by the route)
    (async () => {
      try {
        const capture = await prisma.capture.findUnique({ where: { id: captureId } });
        if (capture) {
          await prisma.capture.update({
            where: { id: captureId },
            data: { processingStatus: 'processing' }
          });
          await getCoordinator().processCapture(capture, userId);
        }
      } catch (err) {
        logger.error(`[Queue] Direct processing error for ${captureId}:`, err);
      }
    })();

    return { id: 'direct' };
  }

  return queue.add('process-capture', { captureId, userId });
}

export async function addReminderJob(reminderId: string, scheduledAt: Date) {
  const queue = await getQueue('reminder-sending', _reminderQueue, (q) => _reminderQueue = q);
  if (!queue) {
    logger.info(`[Queue] Reminder ${reminderId} saved (queue not available)`);
    return { id: 'direct' };
  }
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());
  return queue.add('send-reminder', { reminderId }, { delay, attempts: 5 });
}

export async function addProactiveJob(userId: string, type: string, data: any) {
  const queue = await getQueue('proactive-agent', _proactiveQueue, (q) => _proactiveQueue = q);
  if (!queue) return { id: 'direct' };
  return queue.add('proactive-action', { userId, type, data });
}

export async function addPatternLearningJob(userId: string, captureId: string) {
  const queue = await getQueue('pattern-learning', _patternLearningQueue, (q) => _patternLearningQueue = q);
  if (!queue) return { id: 'direct' };
  return queue.add('learn-patterns', { userId, captureId }, { delay: 5000 });
}

// Exported queue references (null until first use)
export const captureQueue = null;
export const reminderQueue = null;
export const proactiveQueue = null;
export const patternLearningQueue = null;

if (!REDIS_URL) {
  logger.warn('[Queue] REDIS_URL not set - job queuing will be disabled');
}
