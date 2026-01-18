import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { createReminderSchema, updateReminderSchema } from '../utils/validators.js';
import { addReminderJob } from '../services/queue.js';

export async function reminderRoutes(fastify: FastifyInstance) {
  // CREATE REMINDER
  fastify.post(
    '/api/reminders',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;

      try {
        const body = createReminderSchema.parse(request.body);
        const scheduledAt = new Date(body.scheduledAt);

        const reminder = await prisma.reminder.create({
          data: {
            userId,
            captureId: body.captureId,
            message: body.message,
            scheduledAt,
            recurring: body.recurring || false,
            recurringRule: body.recurringRule,
            status: 'PENDING',
          },
        });

        // Add to reminder queue
        await addReminderJob(reminder.id, scheduledAt);

        logger.info(`[API] Created reminder ${reminder.id} for user ${userId}`);

        return {
          success: true,
          data: reminder,
        };
      } catch (error: any) {
        logger.error('[API] Error creating reminder:', error);
        throw error;
      }
    }
  );

  // GET REMINDERS
  fastify.get(
    '/api/reminders',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;
      const { status, limit = '20', offset = '0' } = request.query as {
        status?: string;
        limit?: string;
        offset?: string;
      };

      try {
        const where: any = {
          userId,
          ...(status && { status }),
        };

        const [reminders, total] = await Promise.all([
          prisma.reminder.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
              capture: {
                select: {
                  id: true,
                  metadata: true,
                },
              },
            },
          }),
          prisma.reminder.count({ where }),
        ]);

        return {
          success: true,
          data: reminders,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total,
          },
        };
      } catch (error: any) {
        logger.error('[API] Error fetching reminders:', error);
        throw error;
      }
    }
  );

  // UPDATE REMINDER
  fastify.patch(
    '/api/reminders/:id',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      try {
        const body = updateReminderSchema.parse(request.body);

        // Verify ownership
        const existing = await prisma.reminder.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Reminder not found',
          });
        }

        const reminder = await prisma.reminder.update({
          where: { id },
          data: {
            ...(body.message && { message: body.message }),
            ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt) }),
            ...(body.status && { status: body.status }),
          },
        });

        logger.info(`[API] Updated reminder ${id}`);

        return {
          success: true,
          data: reminder,
        };
      } catch (error: any) {
        logger.error('[API] Error updating reminder:', error);
        throw error;
      }
    }
  );

  // DELETE REMINDER
  fastify.delete(
    '/api/reminders/:id',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      try {
        // Verify ownership
        const existing = await prisma.reminder.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Reminder not found',
          });
        }

        await prisma.reminder.delete({
          where: { id },
        });

        logger.info(`[API] Deleted reminder ${id}`);

        return {
          success: true,
          message: 'Reminder deleted',
        };
      } catch (error: any) {
        logger.error('[API] Error deleting reminder:', error);
        throw error;
      }
    }
  );
}
