import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger.js';
import {
  getAuthUrl,
  exchangeCodeForTokens,
  createCalendarEvent,
  listUpcomingEvents,
  syncCalendarEventsToReminders,
  getCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../services/calendar.js';
import { createCalendarEventSchema } from '../utils/validators.js';

export async function calendarRoutes(fastify: FastifyInstance) {
  // GET OAUTH URL
  fastify.get(
    '/api/calendar/auth/url',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (_request, _reply) => {
      try {
        const authUrl = getAuthUrl();

        return {
          success: true,
          authUrl,
        };
      } catch (error: any) {
        logger.error('[API] Error getting calendar auth URL:', error);
        throw error;
      }
    }
  );

  // HANDLE OAUTH CALLBACK
  fastify.get('/api/calendar/auth/callback', async (request, reply) => {
    const { code } = request.query as { code?: string; state?: string };

    if (!code) {
      return reply.code(400).send({
        success: false,
        error: 'Missing authorization code',
      });
    }

    try {
      // In a real app, you'd verify the state parameter and extract userId from it
      // For now, we'll require the user to be authenticated
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'User not authenticated',
        });
      }

      await exchangeCodeForTokens(code, userId);

      // Trigger initial sync in background (don't wait for it)
      syncCalendarEventsToReminders(userId).catch((error) => {
        logger.error(`[API] Error in initial calendar sync for user ${userId}:`, error);
      });

      return {
        success: true,
        message: 'Google Calendar connected successfully',
      };
    } catch (error: any) {
      logger.error('[API] Error handling calendar callback:', error);
      throw error;
    }
  });

  // CREATE EVENT
  fastify.post(
    '/api/calendar/events',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;

      try {
        const body = createCalendarEventSchema.parse(request.body);

        const event = await createCalendarEvent(userId, body);

        logger.info(`[API] Created calendar event for user ${userId}`);

        return {
          success: true,
          data: event,
        };
      } catch (error: any) {
        logger.error('[API] Error creating calendar event:', error);
        throw error;
      }
    }
  );

  // LIST UPCOMING EVENTS
  fastify.get(
    '/api/calendar/events',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;
      const { maxResults = '10' } = request.query as { maxResults?: string };

      try {
        const events = await listUpcomingEvents(userId, parseInt(maxResults));

        return {
          success: true,
          data: events,
        };
      } catch (error: any) {
        logger.error('[API] Error listing calendar events:', error);
        throw error;
      }
    }
  );

  // GET SPECIFIC EVENT
  fastify.get(
    '/api/calendar/events/:eventId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const { eventId } = request.params as { eventId: string };

      try {
        const event = await getCalendarEvent(userId, eventId);

        if (!event) {
          return reply.code(404).send({
            success: false,
            error: 'Event not found',
          });
        }

        return {
          success: true,
          data: event,
        };
      } catch (error: any) {
        logger.error('[API] Error getting calendar event:', error);
        throw error;
      }
    }
  );

  // UPDATE EVENT
  fastify.put(
    '/api/calendar/events/:eventId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const { eventId } = request.params as { eventId: string };

      try {
        const body = createCalendarEventSchema.partial().parse(request.body);

        const event = await updateCalendarEvent(userId, eventId, body);

        logger.info(`[API] Updated calendar event ${eventId} for user ${userId}`);

        return {
          success: true,
          data: event,
        };
      } catch (error: any) {
        logger.error('[API] Error updating calendar event:', error);
        throw error;
      }
    }
  );

  // DELETE EVENT
  fastify.delete(
    '/api/calendar/events/:eventId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;
      const { eventId } = request.params as { eventId: string };

      try {
        await deleteCalendarEvent(userId, eventId);

        logger.info(`[API] Deleted calendar event ${eventId} for user ${userId}`);

        return {
          success: true,
          message: 'Event deleted',
        };
      } catch (error: any) {
        logger.error('[API] Error deleting calendar event:', error);
        throw error;
      }
    }
  );

  // SYNC CALENDAR EVENTS TO REMINDERS
  fastify.post(
    '/api/calendar/sync',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const stats = await syncCalendarEventsToReminders(userId);

        logger.info(`[API] Calendar sync triggered for user ${userId}`);

        return {
          success: true,
          data: stats,
          message: `Sync complete: ${stats.created} created, ${stats.updated} updated, ${stats.errors} errors`,
        };
      } catch (error: any) {
        logger.error('[API] Error syncing calendar:', error);
        throw error;
      }
    }
  );
}
