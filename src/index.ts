import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { testDatabaseConnection } from './config/database.js';
import { testRedisConnection } from './config/redis.js';
import { initializeFirebase } from './config/firebase.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { authenticateJWT } from './middleware/auth.js';

// Import routes (will be created next)
import { authRoutes } from './routes/auth.js';
import { captureRoutes } from './routes/captures.js';
import { chatRoutes } from './routes/chat.js';
import { reminderRoutes } from './routes/reminders.js';
import { collectionRoutes } from './routes/collections.js';
import { calendarRoutes } from './routes/calendar.js';
import { voiceRoutes } from './routes/voice.js';
import { webhookRoutes } from './routes/webhooks.js';

/**
 * Build Fastify server
 */
async function buildServer() {
  const fastify = Fastify({
    logger: false, // We use Pino logger separately
    disableRequestLogging: true,
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  await fastify.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '1 minute',
    redis: await import('./config/redis.js').then((m) => m.redis),
  });

  await fastify.register(formbody);
  await fastify.register(multipart);

  // Add custom decorators
  fastify.decorate('authenticate', authenticateJWT);

  // Global hooks
  fastify.addHook('onRequest', requestLogger);

  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
    });
  });

  // API routes
  await fastify.register(authRoutes);
  await fastify.register(captureRoutes);
  await fastify.register(chatRoutes);
  await fastify.register(reminderRoutes);
  await fastify.register(collectionRoutes);
  await fastify.register(calendarRoutes);
  await fastify.register(voiceRoutes);
  await fastify.register(webhookRoutes);

  // Error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  return fastify;
}

/**
 * Start the server
 */
async function start() {
  try {
    logger.info('🚀 Starting Stash Backend - Autonomous AI System');

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      logger.error('Failed to connect to Redis. Exiting...');
      process.exit(1);
    }

    // Initialize Firebase (optional)
    initializeFirebase();

    // Build and start server
    const fastify = await buildServer();

    await fastify.listen({
      port: config.server.port,
      host: '0.0.0.0',
    });

    logger.info(`✅ Server listening on port ${config.server.port}`);
    logger.info(`📍 Environment: ${config.server.nodeEnv}`);
    logger.info(`🔗 API URL: ${config.server.apiUrl}`);
    logger.info('');
    logger.info('🤖 Agentic AI Backend Online - Ready to think, decide, and act!');
    logger.info('');
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
start();
