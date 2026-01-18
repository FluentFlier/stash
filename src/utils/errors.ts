import { FastifyReply } from 'fastify';
import { logger } from './logger.js';
import { config } from '../config/env.js';

/**
 * Standardized error response interface
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
  retryAfter?: number;
}

/**
 * Error codes for standardized responses
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Security errors
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details?: any,
  statusCode: number = 500,
  retryAfter?: number
): { statusCode: number; response: ErrorResponse } {
  const response: ErrorResponse = {
    success: false,
    error,
    code,
    timestamp: new Date().toISOString(),
  };

  if (details && config.server.nodeEnv === 'development') {
    response.details = details;
  }

  if (retryAfter) {
    response.retryAfter = retryAfter;
  }

  return { statusCode, response };
}

/**
 * Send a standardized error response
 */
export function sendErrorResponse(
  reply: FastifyReply,
  error: string,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details?: any,
  statusCode: number = 500,
  retryAfter?: number
): FastifyReply {
  const { statusCode: finalStatusCode, response } = createErrorResponse(
    error,
    code,
    details,
    statusCode,
    retryAfter
  );

  logger.error(`[ErrorResponse] ${code}: ${error}`, {
    statusCode: finalStatusCode,
    details: config.server.nodeEnv === 'development' ? details : undefined,
  });

  return reply.code(finalStatusCode).send(response);
}

/**
 * Common error response helpers
 */
export const ErrorResponses = {
  // Authentication
  unauthorized: (reply: FastifyReply, message: string = 'Authentication required') =>
    sendErrorResponse(reply, message, ErrorCode.UNAUTHORIZED, undefined, 401),

  forbidden: (reply: FastifyReply, message: string = 'Access denied') =>
    sendErrorResponse(reply, message, ErrorCode.FORBIDDEN, undefined, 403),

  tokenExpired: (reply: FastifyReply) =>
    sendErrorResponse(reply, 'Token has expired', ErrorCode.TOKEN_EXPIRED, undefined, 401),

  tokenInvalid: (reply: FastifyReply) =>
    sendErrorResponse(reply, 'Invalid token', ErrorCode.TOKEN_INVALID, undefined, 401),

  // Validation
  validation: (reply: FastifyReply, details: any) =>
    sendErrorResponse(reply, 'Validation failed', ErrorCode.VALIDATION_ERROR, details, 400),

  invalidInput: (reply: FastifyReply, message: string) =>
    sendErrorResponse(reply, message, ErrorCode.INVALID_INPUT, undefined, 400),

  missingField: (reply: FastifyReply, field: string) =>
    sendErrorResponse(reply, `Required field missing: ${field}`, ErrorCode.MISSING_REQUIRED_FIELD, { field }, 400),

  // Resources
  notFound: (reply: FastifyReply, resource: string = 'Resource') =>
    sendErrorResponse(reply, `${resource} not found`, ErrorCode.NOT_FOUND, undefined, 404),

  conflict: (reply: FastifyReply, message: string) =>
    sendErrorResponse(reply, message, ErrorCode.CONFLICT, undefined, 409),

  alreadyExists: (reply: FastifyReply, resource: string) =>
    sendErrorResponse(reply, `${resource} already exists`, ErrorCode.ALREADY_EXISTS, undefined, 409),

  // Rate limiting
  rateLimitExceeded: (reply: FastifyReply, retryAfter: number) =>
    sendErrorResponse(reply, 'Too many requests', ErrorCode.RATE_LIMIT_EXCEEDED, undefined, 429, retryAfter),

  // Server errors
  internal: (reply: FastifyReply, message: string = 'Internal server error') =>
    sendErrorResponse(reply, message, ErrorCode.INTERNAL_ERROR, undefined, 500),

  database: (reply: FastifyReply, details?: any) =>
    sendErrorResponse(reply, 'Database error', ErrorCode.DATABASE_ERROR, details, 500),

  externalService: (reply: FastifyReply, service: string) =>
    sendErrorResponse(reply, `External service error: ${service}`, ErrorCode.EXTERNAL_SERVICE_ERROR, undefined, 502),

  // Security
  securityViolation: (reply: FastifyReply, message: string) =>
    sendErrorResponse(reply, message, ErrorCode.SECURITY_VIOLATION, undefined, 400),

  suspiciousActivity: (reply: FastifyReply) =>
    sendErrorResponse(reply, 'Suspicious activity detected', ErrorCode.SUSPICIOUS_ACTIVITY, undefined, 400),
};