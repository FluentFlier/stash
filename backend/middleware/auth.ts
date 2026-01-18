import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * JWT Authentication middleware
 * Verifies Supabase JWT token using Supabase's auth.getUser()
 * This handles ES256 asymmetric tokens properly
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

    if (!supabaseAdmin) {
      logger.error('[Auth] Supabase admin client not initialized');
      return reply.code(500).send({
        success: false,
        error: 'Authentication service unavailable',
      });
    }

    // Use Supabase to verify the token (handles ES256)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.error('[Auth] Token verification failed:', error?.message);
      return reply.code(401).send({
        success: false,
        error: 'Invalid token',
      });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name,
    };

    logger.info(`[Auth] Authenticated user: ${user.email}`);
  } catch (error: any) {
    logger.error('[Auth] Authentication error:', error.message);
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

    if (!authHeader || !authHeader.startsWith('Bearer ') || !supabaseAdmin) {
      return;
    }

    const token = authHeader.substring(7);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (user) {
      request.user = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('[Auth] Optional authentication failed');
  }
}
