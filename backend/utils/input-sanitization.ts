import DOMPurify from 'isomorphic-dompurify';
import { logger } from './logger.js';

/**
 * Input sanitization utilities for security
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  const originalLength = input.length;
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });

  if (sanitized.length !== originalLength) {
    logger.warn('[InputSanitization] HTML content sanitized:', {
      originalLength,
      sanitizedLength: sanitized.length,
    });
  }

  return sanitized;
}

/**
 * Sanitize text input by removing potentially dangerous characters
 */
export function sanitizeText(input: string, options: {
  allowHtml?: boolean;
  maxLength?: number;
  allowNewlines?: boolean;
} = {}): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  let sanitized = input;

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Handle HTML based on options
  if (options.allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
      ALLOWED_ATTR: ['href'],
    });
  } else {
    sanitized = sanitizeHtml(sanitized);
  }

  // Handle newlines
  if (!options.allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // Trim and limit length
  sanitized = sanitized.trim();
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
    logger.warn('[InputSanitization] Text truncated due to length limit:', {
      maxLength: options.maxLength,
      truncatedLength: sanitized.length,
    });
  }

  return sanitized;
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  try {
    // Use URL constructor to validate and normalize
    const url = new URL(input);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      logger.warn('[InputSanitization] Invalid URL protocol:', {
        protocol: url.protocol,
        url: input,
      });
      return '';
    }

    // Reconstruct clean URL
    return url.toString();
  } catch (error) {
    logger.warn('[InputSanitization] Invalid URL format:', { url: input });
    return '';
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  const sanitized = input.toLowerCase().trim();

  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(sanitized)) {
    logger.warn('[InputSanitization] Invalid email format:', { email: input });
    return '';
  }

  return sanitized;
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Remove path traversal attempts
  let sanitized = input
    .replace(/\.\./g, '') // Remove ..
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/[<>:|?*"]/g, '') // Remove invalid filename characters
    .trim();

  // Limit filename length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  if (sanitized !== input) {
    logger.warn('[InputSanitization] Filename sanitized:', {
      original: input,
      sanitized,
    });
  }

  return sanitized;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any, options: {
  min?: number;
  max?: number;
  defaultValue?: number;
} = {}): number {
  let num: number;

  if (typeof input === 'string') {
    num = parseFloat(input);
  } else if (typeof input === 'number') {
    num = input;
  } else {
    num = options.defaultValue ?? 0;
  }

  // Check for NaN, Infinity
  if (!isFinite(num)) {
    logger.warn('[InputSanitization] Invalid number detected:', { input, num });
    return options.defaultValue ?? 0;
  }

  // Apply min/max bounds
  if (options.min !== undefined && num < options.min) {
    num = options.min;
  }
  if (options.max !== undefined && num > options.max) {
    num = options.max;
  }

  return num;
}

/**
 * Sanitize array input
 */
export function sanitizeArray(input: any, options: {
  maxLength?: number;
  itemSanitizer?: (item: any) => any;
} = {}): any[] {
  if (!Array.isArray(input)) {
    return [];
  }

  let sanitized = input;

  // Limit array length
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.slice(0, options.maxLength);
    logger.warn('[InputSanitization] Array truncated due to length limit:', {
      maxLength: options.maxLength,
      originalLength: input.length,
    });
  }

  // Sanitize each item
  if (options.itemSanitizer) {
    sanitized = sanitized.map(options.itemSanitizer);
  }

  return sanitized;
}

/**
 * Sanitize object input recursively
 */
export function sanitizeObject(input: any, schema?: Record<string, (value: any) => any>): any {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    // Skip prototype properties
    if (!input.hasOwnProperty(key)) {
      continue;
    }

    // Use schema sanitizer if provided, otherwise basic sanitization
    if (schema && schema[key]) {
      sanitized[key] = schema[key](value);
    } else {
      // Default sanitization based on type
      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      } else if (typeof value === 'number') {
        sanitized[key] = sanitizeNumber(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = sanitizeArray(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Validate input against common security patterns
 */
export function validateSecurityPatterns(input: string, context: string = 'general'): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (!input || typeof input !== 'string') {
    return { isValid: true, violations: [] };
  }

  // SQL injection patterns
  const sqlPatterns = [
    /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bupdate\b|\bdrop\b|\bcreate\b|\balter\b|\bexec\b|\bexecute\b)/i,
    /('|(\\x27)|(\-\-)|(;))/i,
  ];

  // XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
  ];

  // Path traversal patterns
  const pathPatterns = [
    /\.\./,
    /\/etc\/passwd/,
    /\/windows\/system32/,
  ];

  const allPatterns = [
    { name: 'SQL injection', patterns: sqlPatterns },
    { name: 'XSS', patterns: xssPatterns },
    { name: 'Path traversal', patterns: pathPatterns },
  ];

  for (const { name, patterns } of allPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        violations.push(`${name} pattern detected`);
        break; // Only report once per category
      }
    }
  }

  if (violations.length > 0) {
    logger.warn('[InputValidation] Security violations detected:', {
      context,
      violations,
      inputSnippet: input.substring(0, 100),
    });
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}