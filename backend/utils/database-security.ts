import { logger } from './logger.js';

/**
 * Database security utilities and query sanitization
 */

/**
 * Sanitize database query parameters to prevent injection
 */
export function sanitizeQueryParams(params: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Basic sanitization - remove potentially dangerous characters
      const cleanValue = value
        .replace(/[<>'"&]/g, '') // Remove HTML/XML characters
        .replace(/\x00/g, '') // Remove null bytes
        .trim();

      // Log if value was modified
      if (cleanValue !== value) {
        logger.warn('[DatabaseSecurity] Query parameter sanitized:', {
          key,
          originalLength: value.length,
          sanitizedLength: cleanValue.length,
        });
      }

      sanitized[key] = cleanValue;
    } else if (typeof value === 'number') {
      // Ensure numbers are within reasonable bounds
      if (!isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
        logger.warn('[DatabaseSecurity] Suspicious number value:', { key, value });
        sanitized[key] = 0; // Default to 0 for suspicious values
      } else {
        sanitized[key] = value;
      }
    } else if (Array.isArray(value)) {
      // Sanitize array elements
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          return item.replace(/[<>'"&]/g, '').replace(/\x00/g, '').trim();
        }
        return item;
      });
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate database operations for suspicious patterns
 */
export function validateDatabaseOperation(operation: string, params: any): boolean {
  // Check for suspicious patterns in queries
  const suspiciousPatterns = [
    /\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b.*\b(select|union)\b/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\-\-)|(;)|(\%3B))/i, // SQL injection patterns
    /script|javascript|vbscript|onload|onerror/i, // XSS in data
  ];

  // Convert params to string for pattern checking
  const paramsString = JSON.stringify(params);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(paramsString)) {
      logger.warn('[DatabaseSecurity] Suspicious database operation detected:', {
        operation,
        pattern: pattern.toString(),
        paramsSnippet: paramsString.substring(0, 200),
      });
      return false;
    }
  }

  return true;
}

/**
 * Rate limiting for database operations per user
 */
const userOperationCounts = new Map<string, { count: number; resetTime: number }>();

export function checkDatabaseRateLimit(
  userId: string,
  operation: string,
  maxOperations: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const userKey = `${userId}:${operation}`;

  const userData = userOperationCounts.get(userKey);

  if (!userData || now > userData.resetTime) {
    // Reset or initialize
    userOperationCounts.set(userKey, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (userData.count >= maxOperations) {
    logger.warn('[DatabaseSecurity] Database rate limit exceeded:', {
      userId,
      operation,
      count: userData.count,
      resetIn: Math.ceil((userData.resetTime - now) / 1000),
    });
    return false;
  }

  userData.count++;
  return true;
}

/**
 * Log database operations for audit trail
 */
export function logDatabaseOperation(
  userId: string | null,
  operation: string,
  table: string,
  params?: any
): void {
  logger.info('[DatabaseAudit] Operation performed:', {
    userId,
    operation,
    table,
    timestamp: new Date().toISOString(),
    // Don't log sensitive params in production
    ...(process.env.NODE_ENV === 'development' && { params }),
  });
}

/**
 * Database query timeout wrapper
 */
export async function withQueryTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000,
  operationName: string = 'database query'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      logger.error(`[DatabaseSecurity] ${operationName} timed out after ${timeoutMs}ms`);
      reject(new Error(`${operationName} timed out`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}