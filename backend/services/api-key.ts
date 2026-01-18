import { nanoid } from 'nanoid';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * API Key service for managing secure API key operations
 */

export interface ApiKeyData {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface CreateApiKeyOptions {
  name: string;
  permissions: string[];
  expiresInDays?: number;
  userId: string;
}

/**
 * Generate a secure API key
 */
export function generateApiKey(prefix: string = 'sk', length: number = 32): string {
  const key = nanoid(length);
  return `${prefix}_${key}`;
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(options: CreateApiKeyOptions): Promise<ApiKeyData> {
  try {
    const key = generateApiKey();
    const hashedKey = await hashApiKey(key); // In production, use proper hashing

    const expiresAt = options.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    // For now, store in environment or database
    // In a real implementation, you'd have an api_keys table
    const apiKeyData: ApiKeyData = {
      id: nanoid(),
      key: hashedKey,
      name: options.name,
      userId: options.userId,
      permissions: options.permissions,
      expiresAt,
      createdAt: new Date(),
      isActive: true,
    };

    // Store in a simple in-memory store for demo
    // In production, use Redis or database
    globalApiKeys.set(hashedKey, apiKeyData);

    logger.info('[ApiKey] Created new API key:', {
      id: apiKeyData.id,
      name: options.name,
      userId: options.userId,
      permissions: options.permissions,
    });

    // Return the plain key (only time it's visible)
    return {
      ...apiKeyData,
      key, // Return plain key for user to copy
    };
  } catch (error) {
    logger.error('[ApiKey] Error creating API key:', error);
    throw error;
  }
}

/**
 * Validate an API key and return key data
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyData | null> {
  try {
    if (!apiKey || typeof apiKey !== 'string') {
      return null;
    }

    // Check internal API key first
    if (config.security.internalApiKey && apiKey === config.security.internalApiKey) {
      return {
        id: 'internal',
        key: apiKey,
        name: 'Internal Service',
        userId: 'system',
        permissions: ['read', 'write', 'admin'],
        createdAt: new Date(),
        isActive: true,
      };
    }

    // Hash the incoming key for lookup
    const hashedKey = await hashApiKey(apiKey);
    const keyData = globalApiKeys.get(hashedKey);

    if (!keyData) {
      logger.warn('[ApiKey] Invalid API key attempted');
      return null;
    }

    // Check if key is active
    if (!keyData.isActive) {
      logger.warn('[ApiKey] Inactive API key used:', { id: keyData.id });
      return null;
    }

    // Check expiration
    if (keyData.expiresAt && keyData.expiresAt < new Date()) {
      logger.warn('[ApiKey] Expired API key used:', { id: keyData.id });
      return null;
    }

    // Update last used timestamp
    keyData.lastUsedAt = new Date();

    logger.info('[ApiKey] Valid API key used:', {
      id: keyData.id,
      name: keyData.name,
      userId: keyData.userId,
    });

    return keyData;
  } catch (error) {
    logger.error('[ApiKey] Error validating API key:', error);
    return null;
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  try {
    // Find and revoke the key
    for (const [_hashedKey, keyData] of globalApiKeys.entries()) {
      if (keyData.id === keyId && keyData.userId === userId) {
        keyData.isActive = false;
        logger.info('[ApiKey] Revoked API key:', { id: keyId, userId });
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('[ApiKey] Error revoking API key:', error);
    return false;
  }
}

/**
 * List API keys for a user (without revealing the actual keys)
 */
export async function listApiKeys(userId: string): Promise<Omit<ApiKeyData, 'key'>[]> {
  try {
    const userKeys: Omit<ApiKeyData, 'key'>[] = [];

    for (const keyData of globalApiKeys.values()) {
      if (keyData.userId === userId) {
        const { key, ...publicData } = keyData;
        userKeys.push(publicData);
      }
    }

    return userKeys;
  } catch (error) {
    logger.error('[ApiKey] Error listing API keys:', error);
    return [];
  }
}

/**
 * Rotate an API key (create new, revoke old)
 */
export async function rotateApiKey(keyId: string, userId: string): Promise<ApiKeyData | null> {
  try {
    // Find the old key
    let oldKeyData: ApiKeyData | undefined;

    for (const keyData of globalApiKeys.values()) {
      if (keyData.id === keyId && keyData.userId === userId) {
        oldKeyData = keyData;
        break;
      }
    }

    if (!oldKeyData) {
      return null;
    }

    // Revoke old key
    await revokeApiKey(keyId, userId);

    // Create new key with same permissions
    const newKey = await createApiKey({
      name: `${oldKeyData.name} (rotated)`,
      permissions: oldKeyData.permissions,
      userId: oldKeyData.userId,
    });

    logger.info('[ApiKey] Rotated API key:', {
      oldId: keyId,
      newId: newKey.id,
      userId,
    });

    return newKey;
  } catch (error) {
    logger.error('[ApiKey] Error rotating API key:', error);
    return null;
  }
}

/**
 * Check if an API key has a specific permission
 */
export function hasPermission(keyData: ApiKeyData, permission: string): boolean {
  return keyData.permissions.includes(permission) || keyData.permissions.includes('admin');
}

/**
 * Hash API key for storage (simple hash for demo - use proper crypto in production)
 */
async function hashApiKey(apiKey: string): Promise<string> {
  // In production, use proper cryptographic hashing like bcrypt or Argon2
  // For demo purposes, we'll use a simple approach
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// In-memory storage for demo purposes
// In production, use Redis or database
const globalApiKeys = new Map<string, ApiKeyData>();

// Clean up expired keys periodically
setInterval(() => {
  const now = new Date();
  let cleaned = 0;

  for (const [hashedKey, keyData] of globalApiKeys.entries()) {
    if (keyData.expiresAt && keyData.expiresAt < now) {
      globalApiKeys.delete(hashedKey);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`[ApiKey] Cleaned up ${cleaned} expired API keys`);
  }
}, 60 * 60 * 1000); // Check every hour