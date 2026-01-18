import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';
import { ErrorResponses } from '../utils/errors.js';

/**
 * Global error handler for Fastify with standardized responses
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
    const validationDetails = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return ErrorResponses.validation(reply, validationDetails);
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      const field = error.meta?.target as string || 'field';
      return ErrorResponses.conflict(reply, `A record with this ${field} already exists`);
    }

    // Record not found
    if (error.code === 'P2025') {
      return ErrorResponses.notFound(reply, 'Record');
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return ErrorResponses.invalidInput(reply, 'Invalid reference to related record');
    }

    // Database constraint violation
    if (error.code === 'P2004') {
      return ErrorResponses.invalidInput(reply, 'Database constraint violation');
    }

    return ErrorResponses.database(reply, {
      code: error.code,
      meta: error.meta,
    });
  }

  // Prisma connection errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return ErrorResponses.externalService(reply, 'Database');
  }

  // Prisma timeout errors (check by message since type might not be available)
  if (error.message && error.message.includes('timeout')) {
    return ErrorResponses.externalService(reply, 'Database (timeout)');
  }

  // Fastify built-in errors
  if (error.statusCode) {
    // Handle specific HTTP status codes
    switch (error.statusCode) {
      case 400:
        return ErrorResponses.invalidInput(reply, error.message);
      case 401:
        return ErrorResponses.unauthorized(reply, error.message);
      case 403:
        return ErrorResponses.forbidden(reply, error.message);
      case 404:
        return ErrorResponses.notFound(reply, 'Resource');
      case 409:
        return ErrorResponses.conflict(reply, error.message);
      case 429:
        // Rate limiting is handled by the rate limit plugin
        return ErrorResponses.rateLimitExceeded(reply, 60); // Default 60 seconds
      default:
        return reply.code(error.statusCode).send({
          success: false,
          error: error.message,
          code: `HTTP_${error.statusCode}`,
          timestamp: new Date().toISOString(),
        });
    }
  }

  // JWT errors (from our auth middleware)
  if (error.name === 'JsonWebTokenError') {
    return ErrorResponses.tokenInvalid(reply);
  }

  if (error.name === 'TokenExpiredError') {
    return ErrorResponses.tokenExpired(reply);
  }

  // Generic errors
  return ErrorResponses.internal(reply, 'An unexpected error occurred');
}

/**
 * Not found handler with standardized response
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  logger.warn('[NotFoundHandler] Route not found:', {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  });

  return ErrorResponses.notFound(reply, `Route ${request.method} ${request.url}`);
}
