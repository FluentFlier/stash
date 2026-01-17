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

  reply.addHook('onSend', async (_request, _reply, payload) => {
    const duration = Date.now() - start;

    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      userId: request.user?.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return payload;
  });
}
