import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from './logger.js';
import { ErrorResponses } from './errors.js';

// Rate limit storage (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Enhanced rate limiting with different tiers and sliding window
 */
export class RateLimiter {
  private limits: Map<string, {
    maxRequests: number;
    windowMs: number;
    blockDurationMs?: number;
  }> = new Map();

  constructor() {
    // Define rate limit tiers
    this.limits.set('auth', {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    });

    this.limits.set('api', {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    });

    this.limits.set('search', {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
    });

    this.limits.set('admin', {
      maxRequests: 50,
      windowMs: 60 * 1000, // 1 minute
    });

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   */
  checkLimit(
    identifier: string,
    tier: string = 'api',
    options: {
      customLimit?: number;
      customWindow?: number;
    } = {}
  ): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
    const limit = this.limits.get(tier);
    if (!limit) {
      return { allowed: true, remaining: 999, resetTime: Date.now() + 60000 };
    }

    const maxRequests = options.customLimit || limit.maxRequests;
    const windowMs = options.customWindow || limit.windowMs;

    const key = `${tier}:${identifier}`;
    const now = Date.now();
    // const windowStart = now - windowMs; // Not used in current logic

    let entry = rateLimitStore.get(key);

    // Initialize or reset window
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        firstRequest: now,
      };
    }

    // Check if user is in penalty box from previous violations
    if (entry.count >= maxRequests * 2 && limit.blockDurationMs) {
      const penaltyEnd = entry.firstRequest + limit.blockDurationMs;
      if (now < penaltyEnd) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: penaltyEnd,
          retryAfter: Math.ceil((penaltyEnd - now) / 1000),
        };
      }
    }

    const remaining = Math.max(0, maxRequests - entry.count);

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    // Allow request, increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: remaining - 1,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Get rate limit headers for response
   */
  getHeaders(result: { remaining: number; resetTime: number }): Record<string, string> {
    return {
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      'X-RateLimit-Limit': '100', // Default limit
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`[RateLimiter] Cleaned up ${cleaned} expired rate limit entries`);
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware for different endpoint types
 */
export function createRateLimitMiddleware(tier: string, options?: {
  customLimit?: number;
  customWindow?: number;
  skipForUserId?: string[];
}) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Skip rate limiting for specific users (e.g., admin users)
    if (options?.skipForUserId && request.user?.id &&
        options.skipForUserId.includes(request.user.id)) {
      return;
    }

    // Use user ID if authenticated, otherwise IP address
    const identifier = request.user?.id || request.ip;

    const result = rateLimiter.checkLimit(identifier, tier, {
      customLimit: options?.customLimit,
      customWindow: options?.customWindow,
    });

    // Add rate limit headers
    const headers = rateLimiter.getHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      reply.header(key, value);
    });

    if (!result.allowed) {
      logger.warn('[RateLimiter] Rate limit exceeded:', {
        identifier,
        tier,
        ip: request.ip,
        userId: request.user?.id,
        url: request.url,
      });

      return ErrorResponses.rateLimitExceeded(reply, result.retryAfter || 60);
    }
  };
}

// Pre-configured middleware for common use cases
export const authRateLimit = createRateLimitMiddleware('auth');
export const apiRateLimit = createRateLimitMiddleware('api');
export const searchRateLimit = createRateLimitMiddleware('search');
export const adminRateLimit = createRateLimitMiddleware('admin', {
  skipForUserId: [], // Add admin user IDs here
});