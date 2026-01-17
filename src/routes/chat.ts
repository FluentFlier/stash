import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { chatMessageSchema } from '../utils/validators.js';
import { chatWithMemory } from '../services/ai.js';

export async function chatRoutes(fastify: FastifyInstance) {
  // CHAT WITH AI (with Supermemory context)
  fastify.post(
    '/api/chat',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const body = chatMessageSchema.parse(request.body);

        // Get recent conversation history
        const recentMessages = await prisma.chatMessage.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        const conversationHistory = recentMessages
          .reverse()
          .map((msg) => ({
            role: msg.role === 'USER' ? ('user' as const) : ('assistant' as const),
            content: msg.content,
          }));

        // Chat with AI (Supermemory provides context)
        const response = await chatWithMemory(body.message, userId, conversationHistory);

        // Save messages to database
        await prisma.chatMessage.createMany({
          data: [
            {
              userId,
              role: 'USER',
              content: body.message,
            },
            {
              userId,
              role: 'ASSISTANT',
              content: response.message,
              metadata: {
                sources: response.sources || [],
                ...(body.captureId && { captureId: body.captureId }),
              },
            },
          ],
        });

        logger.info(`[API] Chat message processed for user ${userId}`);

        return {
          success: true,
          message: response.message,
          metadata: {
            sources: response.sources || [],
          },
        };
      } catch (error: any) {
        logger.error('[API] Error processing chat:', error);
        throw error;
      }
    }
  );

  // GET CHAT HISTORY
  fastify.get(
    '/api/chat/history',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const { limit = '50', offset = '0' } = request.query as { limit?: string; offset?: string };

      try {
        const messages = await prisma.chatMessage.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
        });

        return {
          success: true,
          data: messages.reverse(),
        };
      } catch (error: any) {
        logger.error('[API] Error fetching chat history:', error);
        throw error;
      }
    }
  );

  // CLEAR CHAT HISTORY
  fastify.delete(
    '/api/chat/history',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        await prisma.chatMessage.deleteMany({
          where: { userId },
        });

        logger.info(`[API] Cleared chat history for user ${userId}`);

        return {
          success: true,
          message: 'Chat history cleared',
        };
      } catch (error: any) {
        logger.error('[API] Error clearing chat history:', error);
        throw error;
      }
    }
  );
}
