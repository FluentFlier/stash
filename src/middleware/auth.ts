import { FastifyRequest, FastifyReply } from 'fastify';
import { crypto } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

export interface JWTPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Authentication middleware
 * Verifies the JWT token and attaches user to request
 */
export async function authenticateJWT(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.code(401).send({
        success: false,
        error: 'No authorization header provided',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid authorization header format. Use: Bearer <token>',
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: 'No token provided',
      });
    }

    // Verify token
    const payload = crypto.verifyToken<JWTPayload>(token);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'User not found',
      });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
    };
  } catch (error: any) {
    logger.error('[Auth] Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send({
        success: false,
        error: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send({
        success: false,
        error: 'Token expired',
      });
    }

    return reply.code(500).send({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // Continue without authentication
    }

    const token = authHeader.substring(7);
    const payload = crypto.verifyToken<JWTPayload>(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('[Auth] Optional authentication failed:', error);
  }
}
