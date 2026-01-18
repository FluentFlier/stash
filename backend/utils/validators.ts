import { z } from 'zod';
import {
  sanitizeText,
  sanitizeEmail,
  validateSecurityPatterns
} from './input-sanitization.js';

// ============================================
// Capture Validators
// ============================================

export const createCaptureSchema = z.object({
  type: z.enum(['link', 'text', 'image', 'video', 'audio', 'pdf', 'document', 'other']),
  content: z.string().min(1).max(10000).refine((val) => {
    const validation = validateSecurityPatterns(val, 'capture content');
    return validation.isValid;
  }, { message: 'Content contains potentially dangerous patterns' }),
  userInput: z.string().max(1000).optional().transform((val) => val ? sanitizeText(val, { maxLength: 1000 }) : val),
  metadata: z.record(z.any()).optional(),
});

export const getCapturesQuerySchema = z.object({
  limit: z.string().optional().default('20'),
  offset: z.string().optional().default('0'),
  type: z.enum(['link', 'text', 'image', 'video', 'audio', 'pdf', 'document', 'other']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

// ============================================
// Chat Validators
// ============================================

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  captureId: z.string().optional(),
});

// ============================================
// Reminder Validators
// ============================================

export const createReminderSchema = z.object({
  captureId: z.string().optional(),
  message: z.string().min(1),
  scheduledAt: z.string().datetime(),
  recurring: z.boolean().optional().default(false),
  recurringRule: z.record(z.any()).optional(),
});

export const updateReminderSchema = z.object({
  message: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'SENT', 'COMPLETED', 'CANCELLED', 'SNOOZED']).optional(),
});

// ============================================
// Collection Validators
// ============================================

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['MANUAL', 'SMART']).default('MANUAL'),
  rules: z.record(z.any()).optional(),
});

export const addToCollectionSchema = z.object({
  captureId: z.string(),
});

// ============================================
// Auth Validators
// ============================================

export const registerSchema = z.object({
  email: z.string().email().transform(sanitizeEmail),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional().transform((val) => val ? sanitizeText(val, { maxLength: 100 }) : val),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1),
});

// ============================================
// Calendar Validators
// ============================================

export const createCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
});

// ============================================
// Type Exports
// ============================================

export type CreateCaptureInput = z.infer<typeof createCaptureSchema>;
export type GetCapturesQuery = z.infer<typeof getCapturesQuerySchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
