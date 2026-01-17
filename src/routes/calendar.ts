import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger.js';
import {
  getAuthUrl,
  exchangeCodeForTokens,
  createCalendarEvent,
  listUpcomingEvents,
} from '../services/calendar.js';
import { createCalendarEventSchema } from '../utils/validators.js';

export async function calendarRoutes(fastify: FastifyInstance) {
  // GET OAUTH URL
  fastify.get(
    '/api/calendar/auth/url',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
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
    const { code, state } = request.query as { code?: string; state?: string };

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
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
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
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
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
}
