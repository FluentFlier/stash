import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger.js';
import {
  createApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
  rotateApiKey,
  CreateApiKeyOptions
} from '../services/api-key.js';
import { ErrorResponses } from '../utils/errors.js';

const createApiKeySchema = {
  type: 'object',
  required: ['name', 'permissions'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    permissions: {
      type: 'array',
      items: { type: 'string', enum: ['read', 'write', 'admin'] },
      minItems: 1,
    },
    expiresInDays: { type: 'number', minimum: 1, maximum: 365 },
  },
};

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // All API key routes require authentication
  fastify.addHook('preHandler', (request, reply) => {
    return (fastify as any).authenticate(request, reply);
  });

  // CREATE API KEY
  fastify.post('/api/keys', {
    schema: {
      body: createApiKeySchema,
    },
  }, async (request, reply) => {
    const userId = request.user.id;
    const body = request.body as CreateApiKeyOptions;

    try {
      // Check if user has permission to create API keys
      // In a real implementation, you'd check user roles/permissions

      const apiKey = await createApiKey({
        ...body,
        userId,
      });

      logger.info('[API] Created API key:', {
        id: apiKey.id,
        name: apiKey.name,
        userId,
      });

      return {
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key, // Only returned once for security
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
        message: 'API key created successfully. Store this key securely - it will not be shown again.',
      };
    } catch (error: any) {
      logger.error('[API] Error creating API key:', error);
      return ErrorResponses.internal(reply, 'Failed to create API key');
    }
  });

  // LIST API KEYS
  fastify.get('/api/keys', async (request, reply) => {
    const userId = request.user.id;

    try {
      const apiKeys = await listApiKeys(userId);

      return {
        success: true,
        data: apiKeys,
      };
    } catch (error: any) {
      logger.error('[API] Error listing API keys:', error);
      return ErrorResponses.internal(reply, 'Failed to list API keys');
    }
  });

  // ROTATE API KEY
  fastify.post('/api/keys/:id/rotate', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params as { id: string };

    try {
      const newApiKey = await rotateApiKey(id, userId);

      if (!newApiKey) {
        return ErrorResponses.notFound(reply, 'API key');
      }

      logger.info('[API] Rotated API key:', { id, userId });

      return {
        success: true,
        data: {
          id: newApiKey.id,
          name: newApiKey.name,
          key: newApiKey.key, // New key returned
          permissions: newApiKey.permissions,
          expiresAt: newApiKey.expiresAt,
          createdAt: newApiKey.createdAt,
        },
        message: 'API key rotated successfully. The old key is now invalid.',
      };
    } catch (error: any) {
      logger.error('[API] Error rotating API key:', error);
      return ErrorResponses.internal(reply, 'Failed to rotate API key');
    }
  });

  // REVOKE API KEY
  fastify.delete('/api/keys/:id', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params as { id: string };

    try {
      const revoked = await revokeApiKey(id, userId);

      if (!revoked) {
        return ErrorResponses.notFound(reply, 'API key');
      }

      logger.info('[API] Revoked API key:', { id, userId });

      return {
        success: true,
        message: 'API key revoked successfully',
      };
    } catch (error: any) {
      logger.error('[API] Error revoking API key:', error);
      return ErrorResponses.internal(reply, 'Failed to revoke API key');
    }
  });

  // VALIDATE API KEY (for testing)
  fastify.post('/api/keys/validate', async (request, reply) => {
    const { key } = request.body as { key: string };

    if (!key) {
      return ErrorResponses.invalidInput(reply, 'API key is required');
    }

    try {
      const keyData = await validateApiKey(key);

      if (!keyData) {
        return ErrorResponses.invalidInput(reply, 'Invalid API key');
      }

      // Don't return the actual key, just metadata
      return {
        success: true,
        data: {
          id: keyData.id,
          name: keyData.name,
          permissions: keyData.permissions,
          isActive: keyData.isActive,
          expiresAt: keyData.expiresAt,
          lastUsedAt: keyData.lastUsedAt,
        },
        message: 'API key is valid',
      };
    } catch (error: any) {
      logger.error('[API] Error validating API key:', error);
      return ErrorResponses.internal(reply, 'Failed to validate API key');
    }
  });
}