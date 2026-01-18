import Queue from 'bull';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ============================================
// Worker Queue Setup
// ============================================
// This file creates actual Bull queues for the worker process.
// Used by capture-processor.ts and reminder-sender.ts

const REDIS_URL = config.redis?.url;

if (!REDIS_URL) {
    logger.error('[Worker] REDIS_URL not configured - workers cannot run!');
    process.exit(1);
}

// Create Bull queues with Redis connection
export const captureQueue = new Queue('capture-processing', REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

export const reminderQueue = new Queue('reminder-sending', REDIS_URL, {
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
    },
});

export const proactiveQueue = new Queue('proactive-agent', REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
    },
});

export const patternLearningQueue = new Queue('pattern-learning', REDIS_URL, {
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 10000 },
    },
});

// Connection event handlers
captureQueue.on('error', (error) => {
    logger.error('[Worker Queue] Capture queue error:', error);
});

reminderQueue.on('error', (error) => {
    logger.error('[Worker Queue] Reminder queue error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('[Worker] Closing queues...');
    await Promise.all([
        captureQueue.close(),
        reminderQueue.close(),
        proactiveQueue.close(),
        patternLearningQueue.close(),
    ]);
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('\n[Worker] SIGINT received. Shutting down workers...');
    await Promise.all([
        captureQueue.close(),
        reminderQueue.close(),
        proactiveQueue.close(),
        patternLearningQueue.close(),
    ]);
    process.exit(0);
});
