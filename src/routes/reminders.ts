import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { createReminderSchema, updateReminderSchema } from '../utils/validators.js';
import { addReminderJob } from '../services/queue.js';
import {
  hasCalendarConnected,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../services/calendar.js';

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

        // Calculate end time (default 1 hour after start)
        const endTime = new Date(scheduledAt.getTime() + 3600000);

        // Create reminder first
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

        // Try to create calendar event if user has calendar connected
        let calendarEventId: string | null = null;
        try {
          const hasCalendar = await hasCalendarConnected(userId);
          if (hasCalendar) {
            const calendarEvent = await createCalendarEvent(userId, {
              title: body.message,
              description: body.captureId ? `Reminder linked to capture ${body.captureId}` : undefined,
              startTime: scheduledAt.toISOString(),
              endTime: endTime.toISOString(),
            });

            calendarEventId = calendarEvent.id;

            // Update reminder with calendar event ID
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                calendarEventId,
                calendarProvider: 'google',
                syncedAt: new Date(),
              },
            });

            logger.info(`[API] Created calendar event ${calendarEventId} for reminder ${reminder.id}`);
          }
        } catch (calendarError: any) {
          // Log error but don't fail reminder creation
          logger.warn(`[API] Failed to create calendar event for reminder ${reminder.id}:`, calendarError);
        }

        // Add to reminder queue
        await addReminderJob(reminder.id, scheduledAt);

        logger.info(`[API] Created reminder ${reminder.id} for user ${userId}`);

        return {
          success: true,
          data: {
            ...reminder,
            calendarEventId,
          },
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

        // Prepare update data
        const updateData: any = {
          ...(body.message && { message: body.message }),
          ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt) }),
          ...(body.status && { status: body.status }),
        };

        // Update reminder
        const reminder = await prisma.reminder.update({
          where: { id },
          data: updateData,
        });

        // Sync to calendar if reminder has calendar event or user has calendar connected
        try {
          const hasCalendar = await hasCalendarConnected(userId);
          if (hasCalendar && (existing.calendarEventId || body.scheduledAt || body.message)) {
            if (existing.calendarEventId) {
              // Update existing calendar event
              const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : existing.scheduledAt;
              const endTime = new Date(scheduledAt.getTime() + 3600000);

              await updateCalendarEvent(userId, existing.calendarEventId, {
                title: body.message || existing.message,
                startTime: scheduledAt.toISOString(),
                endTime: endTime.toISOString(),
              });

              // Update synced timestamp
              await prisma.reminder.update({
                where: { id },
                data: { syncedAt: new Date() },
              });

              logger.info(`[API] Updated calendar event ${existing.calendarEventId} for reminder ${id}`);
            } else if (body.scheduledAt || body.message) {
              // Create new calendar event if reminder doesn't have one
              const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : existing.scheduledAt;
              const endTime = new Date(scheduledAt.getTime() + 3600000);

              const calendarEvent = await createCalendarEvent(userId, {
                title: body.message || existing.message,
                description: existing.captureId ? `Reminder linked to capture ${existing.captureId}` : undefined,
                startTime: scheduledAt.toISOString(),
                endTime: endTime.toISOString(),
              });

              // Update reminder with calendar event ID
              await prisma.reminder.update({
                where: { id },
                data: {
                  calendarEventId: calendarEvent.id,
                  calendarProvider: 'google',
                  syncedAt: new Date(),
                },
              });

              logger.info(`[API] Created calendar event ${calendarEvent.id} for reminder ${id}`);
            }
          }
        } catch (calendarError: any) {
          // Log error but don't fail reminder update
          logger.warn(`[API] Failed to sync reminder ${id} to calendar:`, calendarError);
        }

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

        // Delete associated calendar event if it exists
        if (existing.calendarEventId) {
          try {
            await deleteCalendarEvent(userId, existing.calendarEventId);
            logger.info(`[API] Deleted calendar event ${existing.calendarEventId} for reminder ${id}`);
          } catch (calendarError: any) {
            // Log error but don't fail reminder deletion
            logger.warn(`[API] Failed to delete calendar event ${existing.calendarEventId} for reminder ${id}:`, calendarError);
          }
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
