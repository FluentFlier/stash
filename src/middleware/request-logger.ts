import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

/**
 * Request logging middleware
 */
export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const start = Date.now();

  // Log response using reply.raw
  reply.raw.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[Response] ${request.method} ${request.url}`, {
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      userId: (request as any).user?.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  });
}
