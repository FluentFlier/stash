import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

/**
 * Security middleware for additional request validation and sanitization
 */
export async function securityMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // 1. Log suspicious activities
  if (request.headers['user-agent']?.includes('sqlmap') ||
      request.headers['user-agent']?.includes('nmap') ||
      request.url.includes('union') ||
      request.url.includes('script') ||
      request.url.includes('javascript:')) {
    logger.warn('[Security] Suspicious request detected:', {
      url: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: request.user?.id,
    });
  }

  // 2. Validate request size for different content types
  const contentLength = parseInt(request.headers['content-length'] || '0');
  const contentType = request.headers['content-type'] || '';

  // Stricter limits for different content types
  if (contentType.includes('multipart/form-data')) {
    // File uploads - allow larger but still reasonable
    if (contentLength > 50 * 1024 * 1024) { // 50MB max for file uploads
      return reply.code(413).send({
        success: false,
        error: 'File too large. Maximum size is 50MB.',
      });
    }
  } else if (contentType.includes('application/json')) {
    // JSON requests - stricter limit
    if (contentLength > 1024 * 1024) { // 1MB max for JSON
      return reply.code(413).send({
        success: false,
        error: 'Request too large. Maximum size is 1MB.',
      });
    }
  }

  // 3. Sanitize headers - remove potentially dangerous headers
  const dangerousHeaders = [
    'x-forwarded-for', // We handle this with trustProxy
    'x-real-ip',
    'x-client-ip',
  ];

  dangerousHeaders.forEach(header => {
    if (request.headers[header.toLowerCase()]) {
      delete request.headers[header.toLowerCase()];
    }
  });

  // 4. Check for SQL injection patterns in query parameters
  const sqlInjectionPatterns = [
    /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\-\-)|(#)|(\%23))/i,
  ];

  for (const [key, value] of Object.entries(request.query as Record<string, string>)) {
    if (typeof value === 'string') {
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(value)) {
          logger.warn('[Security] Potential SQL injection detected:', {
            param: key,
            value: value.substring(0, 100), // Log first 100 chars only
            ip: request.ip,
            userId: request.user?.id,
          });

          return reply.code(400).send({
            success: false,
            error: 'Invalid request parameters',
          });
        }
      }
    }
  }

  // 5. Check for XSS patterns in request body
  if (request.body && typeof request.body === 'object') {
    const bodyString = JSON.stringify(request.body);
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(bodyString)) {
        logger.warn('[Security] Potential XSS detected in request body:', {
          ip: request.ip,
          userId: request.user?.id,
          bodySnippet: bodyString.substring(0, 200),
        });

        return reply.code(400).send({
          success: false,
          error: 'Invalid request content',
        });
      }
    }
  }

  // 6. Rate limiting for sensitive endpoints
  if (request.url.includes('/auth/login') || request.url.includes('/auth/register')) {
    // Additional rate limiting for auth endpoints
    // This is handled by the global rate limiter with user-specific keys
  }

  // Continue to next handler
}

/**
 * Content Security Policy middleware for specific routes
 */
export async function cspMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Add additional CSP headers for sensitive routes
  if (request.url.startsWith('/api/admin') || request.url.startsWith('/api/auth')) {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
  }
}

/**
 * API key validation middleware for external services
 */
export async function apiKeyValidation(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // For routes that require API key validation
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.code(401).send({
      success: false,
      error: 'API key required',
    });
  }

  // In a real implementation, you'd validate against a database of API keys
  // For now, we'll just check if it matches an environment variable
  const validApiKey = process.env.INTERNAL_API_KEY;

  if (validApiKey && apiKey !== validApiKey) {
    logger.warn('[Security] Invalid API key attempted:', {
      ip: request.ip,
      apiKeyPrefix: apiKey.substring(0, 8),
    });

    return reply.code(401).send({
      success: false,
      error: 'Invalid API key',
    });
  }
}