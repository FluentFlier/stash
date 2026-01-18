import { FastifyRequest, FastifyReply } from 'fastify';
import { crypto } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

export interface JWTPayload {
  sub: string; // Supabase User ID
  email?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  app_metadata?: any;
  user_metadata?: any;
}

/**
 * JWT Authentication middleware
 * Verifies Supabase JWT token and attaches user to request
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

    // Verify token using Supabase JWT secret
    const payload = crypto.verifyToken<JWTPayload>(token);

    // Verify audience
    if (payload.aud !== 'authenticated') {
      return reply.code(401).send({
        success: false,
        error: 'Invalid token audience',
      });
    }

    // Attach user from token payload (no DB lookup needed)
    request.user = {
      id: payload.sub,
      email: payload.email || '',
      name: payload.user_metadata?.name,
    };
  } catch (error: any) {
    console.error('[Auth] Raw Error:', error);
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
  _reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // Continue without authentication
    }

    const token = authHeader.substring(7);
    const payload = crypto.verifyToken<JWTPayload>(token);

    if (payload.aud === 'authenticated') {
      request.user = {
        id: payload.sub,
        email: payload.email || '',
        name: payload.user_metadata?.name,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('[Auth] Optional authentication failed:', error);
  }
}
