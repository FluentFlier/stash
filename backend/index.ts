import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { authenticateJWT } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { captureRoutes } from './routes/captures.js';
import { chatRoutes } from './routes/chat.js';
import { collectionRoutes } from './routes/collections.js';
import { reminderRoutes } from './routes/reminders.js';
import { calendarRoutes } from './routes/calendar.js';

async function buildServer() {
  const fastify = Fastify({
    logger: false,
    disableRequestLogging: true,
    trustProxy: true,
  });

  // CORS
  await fastify.register(cors, {
    origin: true, // Allow all origins in dev
    credentials: true,
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Rate limiting (generous for dev)
  await fastify.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
  });

  // Health check
  fastify.get('/health', async () => ({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }));

  // Root
  fastify.get('/', async () => ({
    success: true,
    message: 'Stash Backend API',
    version: '1.0.0',
  }));

  // Add authenticate decorator
  fastify.decorate('authenticate', authenticateJWT);

  // Routes - ALL OF THEM
  await fastify.register(authRoutes);
  await fastify.register(captureRoutes);
  await fastify.register(chatRoutes);
  await fastify.register(collectionRoutes);
  await fastify.register(reminderRoutes);
  await fastify.register(calendarRoutes);

  return fastify;
}

async function start() {
  try {
    logger.info('🚀 Starting Stash Backend');

    const fastify = await buildServer();

    await fastify.listen({
      port: config.server.port,
      host: '0.0.0.0',
    });

    logger.info(`✅ Server running on http://localhost:${config.server.port}`);
  } catch (error) {
    logger.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

start();
