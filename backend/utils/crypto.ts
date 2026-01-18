import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const crypto = {

  /**
   * Generate JWT token
   * Note: With Supabase, you typically let Supabase handle token generation.
   */
  generateToken(payload: object): string {
    return jwt.sign(payload, config.supabase.jwtSecret, {
      expiresIn: '7d', // Default fallback
    } as any);
  },

  /**
   * Verify JWT token using Supabase secret
   */
  verifyToken<T = any>(token: string): T {
    return jwt.verify(token, config.supabase.jwtSecret) as T;
  },

  /**
   * Decode JWT token without verification
   */
  decodeToken<T = any>(token: string): T | null {
    return jwt.decode(token) as T;
  },
};
