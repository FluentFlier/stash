import Redis from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

// Redis client for caching
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Reconnect when Redis is in readonly mode
    }
    return false;
  },
});

redis.on('connect', () => {
  logger.info('[Redis] ✅ Connected to Redis');
});

redis.on('error', (error) => {
  logger.error('[Redis] ❌ Redis connection error:', error);
});

redis.on('close', () => {
  logger.warn('[Redis] ⚠️  Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('[Redis] 🔄 Reconnecting to Redis...');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('[Redis] Disconnecting Redis client');
  await redis.quit();
});

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    logger.info('[Redis] ✅ Redis connection successful');
    return true;
  } catch (error) {
    logger.error('[Redis] ❌ Failed to connect to Redis:', error);
    return false;
  }
}

// Cache utilities
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any, expirySeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (expirySeconds) {
        await redis.setex(key, expirySeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      logger.error(`[Cache] Error setting key ${key}:`, error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`[Cache] Error deleting key ${key}:`, error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`[Cache] Error checking key ${key}:`, error);
      return false;
    }
  },
};
