import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { crypto } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { registerSchema, loginSchema, updateFcmTokenSchema } from '../utils/validators.js';
import { authRateLimit } from '../utils/rate-limiting.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Apply strict rate limiting to auth endpoints
  fastify.addHook('preHandler', authRateLimit);

  // Register new user
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'User with this email already exists',
        });
      }

      // Hash password
      const passwordHash = await crypto.hashPassword(body.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      // Generate JWT token
      const token = crypto.generateToken({
        id: user.id,
        email: user.email,
      });

      logger.info(`[Auth] New user registered: ${user.email}`);

      return {
        success: true,
        data: {
          user,
          token,
        },
      };
    } catch (error: any) {
      logger.error('[Auth] Registration error:', error);
      throw error;
    }
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Verify password
      const isValid = await crypto.verifyPassword(body.password, user.passwordHash);

      if (!isValid) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = crypto.generateToken({
        id: user.id,
        email: user.email,
      });

      logger.info(`[Auth] User logged in: ${user.email}`);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
          token,
        },
      };
    } catch (error: any) {
      logger.error('[Auth] Login error:', error);
      throw error;
    }
  });

  // Update FCM token (for push notifications)
  fastify.post(
    '/api/auth/fcm-token',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      try {
        const userId = request.user.id;
        const body = updateFcmTokenSchema.parse(request.body);

        await prisma.user.update({
          where: { id: userId },
          data: { fcmToken: body.fcmToken },
        });

        logger.info(`[Auth] Updated FCM token for user ${userId}`);

        return {
          success: true,
          message: 'FCM token updated',
        };
      } catch (error: any) {
        logger.error('[Auth] FCM token update error:', error);
        throw error;
      }
    }
  );

  // Get current user
  fastify.get(
    '/api/auth/me',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          fcmToken: true,
        },
      });

      return {
        success: true,
        data: user,
      };
    }
  );
}
