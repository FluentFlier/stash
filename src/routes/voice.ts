import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger.js';
import { createVoiceRoom } from '../services/voice.js';

export async function voiceRoutes(fastify: FastifyInstance) {
  // CREATE VOICE ROOM
  fastify.post(
    '/api/voice/room',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const room = await createVoiceRoom(userId);

        logger.info(`[API] Created voice room for user ${userId}: ${room.roomName}`);

        return {
          success: true,
          data: room,
        };
      } catch (error: any) {
        logger.error('[API] Error creating voice room:', error);

        if (error.message.includes('not configured')) {
          return reply.code(503).send({
            success: false,
            error: 'Voice feature not configured',
          });
        }

        throw error;
      }
    }
  );
}
