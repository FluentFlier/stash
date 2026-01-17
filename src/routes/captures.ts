import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { createCaptureSchema, getCapturesQuerySchema } from '../utils/validators.js';
import { addCaptureJob } from '../services/queue.js';

export async function captureRoutes(fastify: FastifyInstance) {
  // CREATE CAPTURE - Main entry point for the agentic system
  fastify.post(
    '/api/captures',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const body = createCaptureSchema.parse(request.body);

        // 1. Create capture immediately
        const capture = await prisma.capture.create({
          data: {
            userId,
            type: body.type,
            content: body.content,
            userInput: body.userInput,
            metadata: body.metadata,
            processingStatus: 'PENDING',
          },
        });

        logger.info(`[API] Created capture ${capture.id} for user ${userId}`);

        // 2. Queue for async processing by autonomous agents
        await addCaptureJob(capture.id, userId);

        logger.info(`[API] Queued capture ${capture.id} for agentic processing`);

        // 3. Return immediately
        return {
          success: true,
          captureId: capture.id,
          status: 'processing',
          message: 'Capture created and queued for autonomous processing',
        };
      } catch (error: any) {
        logger.error('[API] Error creating capture:', error);
        throw error;
      }
    }
  );

  // GET CAPTURES
  fastify.get(
    '/api/captures',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const query = getCapturesQuerySchema.parse(request.query);
        const limit = parseInt(query.limit);
        const offset = parseInt(query.offset);

        const where: any = {
          userId,
          ...(query.type && { type: query.type }),
          ...(query.status && { processingStatus: query.status }),
        };

        const [captures, total] = await Promise.all([
          prisma.capture.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
              tags: {
                include: { tag: true },
              },
            },
          }),
          prisma.capture.count({ where }),
        ]);

        return {
          success: true,
          data: captures,
          pagination: {
            limit,
            offset,
            total,
          },
        };
      } catch (error: any) {
        logger.error('[API] Error fetching captures:', error);
        throw error;
      }
    }
  );

  // GET SINGLE CAPTURE
  fastify.get(
    '/api/captures/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      try {
        const capture = await prisma.capture.findFirst({
          where: { id, userId },
          include: {
            tags: { include: { tag: true } },
            reminders: true,
            collections: { include: { collection: true } },
          },
        });

        if (!capture) {
          return reply.code(404).send({
            success: false,
            error: 'Capture not found',
          });
        }

        return {
          success: true,
          data: capture,
        };
      } catch (error: any) {
        logger.error('[API] Error fetching capture:', error);
        throw error;
      }
    }
  );

  // DELETE CAPTURE
  fastify.delete(
    '/api/captures/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      try {
        // Verify ownership
        const capture = await prisma.capture.findFirst({
          where: { id, userId },
        });

        if (!capture) {
          return reply.code(404).send({
            success: false,
            error: 'Capture not found',
          });
        }

        // Delete capture (cascading deletes will handle related records)
        await prisma.capture.delete({
          where: { id },
        });

        logger.info(`[API] Deleted capture ${id}`);

        return {
          success: true,
          message: 'Capture deleted',
        };
      } catch (error: any) {
        logger.error('[API] Error deleting capture:', error);
        throw error;
      }
    }
  );

  // SEARCH CAPTURES
  fastify.get(
    '/api/captures/search',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const { q, limit = '20' } = request.query as { q?: string; limit?: string };

      if (!q) {
        return reply.code(400).send({
          success: false,
          error: 'Query parameter "q" is required',
        });
      }

      try {
        // Simple text search in metadata
        const captures = await prisma.capture.findMany({
          where: {
            userId,
            OR: [
              {
                metadata: {
                  path: ['title'],
                  string_contains: q,
                },
              },
              {
                metadata: {
                  path: ['description'],
                  string_contains: q,
                },
              },
              {
                content: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            ],
          },
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            tags: { include: { tag: true } },
          },
        });

        return {
          success: true,
          data: captures,
          query: q,
        };
      } catch (error: any) {
        logger.error('[API] Error searching captures:', error);
        throw error;
      }
    }
  );
}
