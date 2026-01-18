import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ============================================
// Queue Stubs for Backend API
// ============================================
// The actual Bull queues run in the worker process only.
// The API just needs helper functions to add jobs.

const REDIS_URL = config.redis?.url;

if (!REDIS_URL) {
  logger.warn('[Queue] REDIS_URL not set - job queuing disabled');
}

// Lazy-loaded queue instances (only created when needed)
let _captureQueue: any = null;
let _reminderQueue: any = null;

async function getCaptureQueue() {
  if (!REDIS_URL) return null;
  if (!_captureQueue) {
    const Queue = (await import('bull')).default;
    _captureQueue = new Queue('capture-processing', REDIS_URL);
  }
  return _captureQueue;
}

async function getReminderQueue() {
  if (!REDIS_URL) return null;
  if (!_reminderQueue) {
    const Queue = (await import('bull')).default;
    _reminderQueue = new Queue('reminder-sending', REDIS_URL);
  }
  return _reminderQueue;
}

// ============================================
// Queue Helpers (used by API routes)
// ============================================

export async function addCaptureJob(captureId: string, userId: string) {
  const queue = await getCaptureQueue();
  if (!queue) {
    logger.info(`[Queue] Capture ${captureId} saved (no queue configured)`);
    return { id: 'direct' };
  }
  return queue.add('process-capture', { captureId, userId });
}

export async function addReminderJob(reminderId: string, scheduledAt: Date) {
  const queue = await getReminderQueue();
  if (!queue) {
    logger.info(`[Queue] Reminder ${reminderId} saved (no queue configured)`);
    return { id: 'direct' };
  }
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());
  return queue.add('send-reminder', { reminderId }, { delay, attempts: 5 });
}

export async function addProactiveJob(userId: string, type: string, data: any) {
  // Proactive jobs only run in worker
  return { id: 'direct' };
}

export async function addPatternLearningJob(userId: string, captureId: string) {
  // Pattern learning only runs in worker
  return { id: 'direct' };
}

// Exported for compatibility with worker imports
export const captureQueue = null;
export const reminderQueue = null;
export const proactiveQueue = null;
export const patternLearningQueue = null;
