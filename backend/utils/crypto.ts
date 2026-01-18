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
    try {
      return jwt.verify(token, config.supabase.jwtSecret) as T;
    } catch (e: any) {
      // In development, handle algorithm mismatch (Supabase RS256 vs Local HS256) by trusting decoding
      // WARNING: Only for local dev with firewall/network issues blocking proper auth verification
      if (process.env.NODE_ENV === 'development' && (e.name === 'JsonWebTokenError' || e.message.includes('invalid algorithm'))) {
        const decoded = jwt.decode(token);
        if (decoded) {
          console.warn('[AUTH] ⚠️ Development Bypass: Trusting decoded token despite verification failure:', e.message);
          return decoded as T;
        }
      }
      throw e;
    }
  },

  /**
   * Decode JWT token without verification
   */
  decodeToken<T = any>(token: string): T | null {
    return jwt.decode(token) as T;
  },
};
