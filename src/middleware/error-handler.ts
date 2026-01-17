import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

/**
 * Global error handler for Fastify
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  logger.error('[ErrorHandler] Error occurred:', {
    url: request.url,
    method: request.method,
    error: error.message,
    stack: error.stack,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.code(400).send({
      success: false,
      error: 'Validation error',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return reply.code(409).send({
        success: false,
        error: 'A record with this value already exists',
      });
    }

    // Record not found
    if (error.code === 'P2025') {
      return reply.code(404).send({
        success: false,
        error: 'Record not found',
      });
    }

    return reply.code(400).send({
      success: false,
      error: 'Database error',
      details: error.message,
    });
  }

  // Fastify errors
  if (error.statusCode) {
    return reply.code(error.statusCode).send({
      success: false,
      error: error.message,
    });
  }

  // Generic errors
  return reply.code(500).send({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack,
    }),
  });
}

/**
 * Not found handler
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return reply.code(404).send({
    success: false,
    error: `Route ${request.method} ${request.url} not found`,
  });
}
