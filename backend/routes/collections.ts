import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { createCollectionSchema, addToCollectionSchema } from '../utils/validators.js';

export async function collectionRoutes(fastify: FastifyInstance) {
  // CREATE COLLECTION
  fastify.post(
    '/api/collections',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;

      try {
        const body = createCollectionSchema.parse(request.body);

        const collection = await prisma.collection.create({
          data: {
            userId,
            name: body.name,
            description: body.description,
            type: body.type,
            rules: body.rules,
          },
        });

        logger.info(`[API] Created collection ${collection.id} for user ${userId}`);

        return {
          success: true,
          data: collection,
        };
      } catch (error: any) {
        logger.error('[API] Error creating collection:', error);
        throw error;
      }
    }
  );

  // GET COLLECTIONS
  fastify.get(
    '/api/collections',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;

      try {
        const collections = await prisma.collection.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { captures: true },
            },
          },
        });

        return {
          success: true,
          data: collections,
        };
      } catch (error: any) {
        logger.error('[API] Error fetching collections:', error);
        throw error;
      }
    }
  );

  // GET COLLECTION WITH CAPTURES
  fastify.get(
    '/api/collections/:id',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      try {
        const collection = await prisma.collection.findFirst({
          where: { id, userId },
          include: {
            captures: {
              include: {
                capture: {
                  include: {
                    tags: { include: { tag: true } },
                  },
                },
              },
              orderBy: { addedAt: 'desc' },
            },
          },
        });

        if (!collection) {
          return reply.code(404).send({
            success: false,
            error: 'Collection not found',
          });
        }

        return {
          success: true,
          data: collection,
        };
      } catch (error: any) {
        logger.error('[API] Error fetching collection:', error);
        throw error;
      }
    }
  );

  // ADD CAPTURE TO COLLECTION
  fastify.post(
    '/api/collections/:id/captures',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      try {
        const body = addToCollectionSchema.parse(request.body);

        // Verify collection ownership
        const collection = await prisma.collection.findFirst({
          where: { id, userId },
        });

        if (!collection) {
          return reply.code(404).send({
            success: false,
            error: 'Collection not found',
          });
        }

        // Verify capture ownership
        const capture = await prisma.capture.findFirst({
          where: { id: body.captureId, userId },
        });

        if (!capture) {
          return reply.code(404).send({
            success: false,
            error: 'Capture not found',
          });
        }

        // Add to collection
        const collectionCapture = await prisma.collectionCapture.create({
          data: {
            collectionId: id,
            captureId: body.captureId,
          },
        });

        logger.info(`[API] Added capture ${body.captureId} to collection ${id}`);

        return {
          success: true,
          data: collectionCapture,
        };
      } catch (error: any) {
        logger.error('[API] Error adding capture to collection:', error);
        throw error;
      }
    }
  );

  // REMOVE CAPTURE FROM COLLECTION
  fastify.delete(
    '/api/collections/:id/captures/:captureId',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      const { id, captureId } = request.params as { id: string; captureId: string };
      const userId = request.user.id;

      try {
        // Verify collection ownership
        const collection = await prisma.collection.findFirst({
          where: { id, userId },
        });

        if (!collection) {
          return reply.code(404).send({
            success: false,
            error: 'Collection not found',
          });
        }

        await prisma.collectionCapture.delete({
          where: {
            collectionId_captureId: {
              collectionId: id,
              captureId,
            },
          },
        });

        logger.info(`[API] Removed capture ${captureId} from collection ${id}`);

        return {
          success: true,
          message: 'Capture removed from collection',
        };
      } catch (error: any) {
        logger.error('[API] Error removing capture from collection:', error);
        throw error;
      }
    }
  );

  // DELETE COLLECTION
  fastify.delete(
    '/api/collections/:id',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      try {
        // Verify ownership
        const collection = await prisma.collection.findFirst({
          where: { id, userId },
        });

        if (!collection) {
          return reply.code(404).send({
            success: false,
            error: 'Collection not found',
          });
        }

        await prisma.collection.delete({
          where: { id },
        });

        logger.info(`[API] Deleted collection ${id}`);

        return {
          success: true,
          message: 'Collection deleted',
        };
      } catch (error: any) {
        logger.error('[API] Error deleting collection:', error);
        throw error;
      }
    }
  );
}
