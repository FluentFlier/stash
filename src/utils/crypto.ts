import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const SALT_ROUNDS = 10;

export const crypto = {
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate JWT token
   */
  generateToken(payload: object): string {
    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn,
    });
  },

  /**
   * Verify JWT token
   */
  verifyToken<T = any>(token: string): T {
    return jwt.verify(token, config.auth.jwtSecret) as T;
  },

  /**
   * Decode JWT token without verification
   */
  decodeToken<T = any>(token: string): T | null {
    return jwt.decode(token) as T;
  },
};
