import Redis from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

// Check if Redis is configured
const REDIS_URL = config.redis?.url;

// Redis client for caching (null if not configured)
export const redis = REDIS_URL
  ? new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  })
  : null;

if (redis) {
  redis.on('connect', () => {
    logger.info('[Redis] ✅ Connected to Redis');
  });

  redis.on('error', (error) => {
    logger.error('[Redis] ❌ Redis connection error:', error.message);
  });

  redis.on('close', () => {
    logger.warn('[Redis] ⚠️  Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('[Redis] 🔄 Reconnecting to Redis...');
  });
} else {
  logger.warn('[Redis] ⚠️  REDIS_URL not configured - caching disabled');
}

// Graceful shutdown
process.on('beforeExit', async () => {
  if (redis) {
    logger.info('[Redis] Disconnecting Redis client');
    await redis.quit();
  }
});

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  if (!redis) {
    logger.warn('[Redis] Redis not configured, skipping connection test');
    return false;
  }
  try {
    await redis.ping();
    logger.info('[Redis] ✅ Redis connection successful');
    return true;
  } catch (error) {
    logger.error('[Redis] ❌ Redis connection failed:', error);
    return false;
  }
}

// Cache utilities (no-op if Redis not configured)
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('[Redis] Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, expirySeconds?: number): Promise<void> {
    if (!redis) return;
    try {
      const serialized = JSON.stringify(value);
      if (expirySeconds) {
        await redis.setex(key, expirySeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      logger.error('[Redis] Cache set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('[Redis] Cache delete error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('[Redis] Cache exists error:', error);
      return false;
    }
  },
};
