import { logger } from '../utils/logger.js';
import { testDatabaseConnection } from '../config/database.js';
import { testRedisConnection } from '../config/redis.js';

// Import workers
import './capture-processor.js';
import './reminder-sender.js';
import { startProactiveAgent } from './proactive-agent.js';
import { startCalendarSync } from './calendar-sync.js';

/**
 * Start all workers
 */
async function startWorkers() {
  try {
    logger.info('🔧 Starting Stash Workers...');

    // Test connections
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      logger.error('Failed to connect to Redis. Exiting...');
      process.exit(1);
    }

    // Start proactive agent
    startProactiveAgent();

    // Start calendar sync worker
    startCalendarSync();

    logger.info('');
    logger.info('✅ All workers started successfully');
    logger.info('');
    logger.info('Workers running:');
    logger.info('  - Capture Processor (processes saved content)');
    logger.info('  - Reminder Sender (sends scheduled reminders)');
    logger.info('  - Proactive Agent (finds opportunities to help)');
    logger.info('  - Calendar Sync (syncs Google Calendar events to reminders)');
    logger.info('');
  } catch (error) {
    logger.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Shutting down workers...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start workers
startWorkers();
