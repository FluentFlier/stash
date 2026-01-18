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
import { securityMiddleware, cspMiddleware } from './middleware/security.js';

// Import routes (will be created next)
import { authRoutes } from './routes/auth.js';
import { captureRoutes } from './routes/captures.js';
import { chatRoutes } from './routes/chat.js';
import { reminderRoutes } from './routes/reminders.js';
import { collectionRoutes } from './routes/collections.js';
import { calendarRoutes } from './routes/calendar.js';
import { voiceRoutes } from './routes/voice.js';
import { apiKeyRoutes } from './routes/api-keys.js';
import { webhookRoutes } from './routes/webhooks.js';

/**
 * Build Fastify server
 */
async function buildServer() {
  const fastify = Fastify({
    logger: false, // We use Pino logger separately
    disableRequestLogging: true,
    trustProxy: true,
    bodyLimit: config.security.bodyLimitMax, // Configurable body limit
    maxParamLength: 500, // Limit parameter length
    caseSensitive: true, // Case sensitive routing
    ignoreTrailingSlash: true, // Ignore trailing slashes
  });

  // Register plugins
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // In production, only allow specified origins
      if (config.server.nodeEnv === 'production') {
        // Strict origin checking
        if (config.security.allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          logger.warn('[Security] CORS violation - origin not allowed:', { origin });
          return callback(new Error('Not allowed by CORS policy'), false);
        }
      }

      // In development, allow common development origins
      const allowedDevOrigins = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https:\/\/localhost(:\d+)?$/,
        /^https:\/\/127\.0\.0\.1(:\d+)?$/,
      ];

      if (allowedDevOrigins.some(pattern => pattern.test(origin))) {
        return callback(null, true);
      }

      logger.warn('[Security] CORS violation - development origin not allowed:', { origin });
      return callback(new Error('Not allowed by CORS policy'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'Accept',
      'Accept-Language',
      'Cache-Control',
    ],
    exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 7200, // 2 hours (reduced from 24 for security)
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  });

  await fastify.register(helmet, {
    // Security headers configuration
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // For admin interfaces if needed
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // May break some integrations
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  });

  await fastify.register(rateLimit, {
    max: config.security.rateLimitMax,
    timeWindow: config.security.rateLimitWindow,
    redis: await import('./config/redis.js').then((m) => m.redis),
    skipOnError: false,
    keyGenerator: (_request) => {
      // Use user ID for authenticated requests, IP for unauthenticated
      return _request.user?.id || _request.ip;
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: 'Too many requests',
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
  });

  await fastify.register(formbody);
  await fastify.register(multipart);

  // Global hooks
  fastify.addHook('onRequest', securityMiddleware);
  fastify.addHook('onRequest', requestLogger);
  fastify.addHook('onRequest', cspMiddleware);

  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
    });
  });

  // API routes (register before hooks to avoid type conflicts)
  await fastify.register(authRoutes);
  await fastify.register(captureRoutes);
  await fastify.register(chatRoutes);
  await fastify.register(reminderRoutes);
  await fastify.register(collectionRoutes);
  await fastify.register(calendarRoutes);
  await fastify.register(voiceRoutes);
  await fastify.register(apiKeyRoutes);
  await fastify.register(webhookRoutes);

  // Add custom decorators after route registration
  fastify.decorate('authenticate', authenticateJWT);

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

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled Rejection at:', reason);
  process.exit(1);
});

// Start server
start();
