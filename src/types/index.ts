import { Capture, User } from '@prisma/client';

// ============================================
// Request Types
// ============================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// ============================================
// Agent Types (exported from agents.ts)
// ============================================

export * from './agents.js';
export * from './api.js';
