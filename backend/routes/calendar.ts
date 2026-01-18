import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger.js';
import {
  getAuthUrl,
  exchangeCodeForTokens,
  getConnectionStatus,
  disconnectCalendar,
  createCalendarEvent,
  listUpcomingEvents,
  getLocalEvents,
  createLocalEvent,
  updateLocalEvent,
  deleteLocalEvent,
  fullSync,
} from '../services/calendar.js';
import { createCalendarEventSchema } from '../utils/validators.js';
import { z } from 'zod';

// Local event schemas
const createLocalEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  isAllDay: z.boolean().optional(),
});

const updateLocalEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().optional(),
  isAllDay: z.boolean().optional(),
});

export async function calendarRoutes(fastify: FastifyInstance) {
  // ============================================
  // OAUTH / CONNECTION MANAGEMENT
  // ============================================

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
        // Return HTML that closes the popup and notifies the parent
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head><title>Calendar Connected</title></head>
            <body>
              <h2>Please log in first</h2>
              <p>Close this window and try again after logging in.</p>
              <script>
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>
        `);
      }

      await exchangeCodeForTokens(code, userId);

      // Return HTML that closes the popup and refreshes the parent
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head><title>Calendar Connected</title></head>
          <body>
            <h2>✅ Google Calendar Connected!</h2>
            <p>You can close this window.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_CALENDAR_CONNECTED' }, '*');
              }
              setTimeout(() => window.close(), 1500);
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      logger.error('[API] Error handling calendar callback:', error);
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head><title>Connection Failed</title></head>
          <body>
            <h2>❌ Connection Failed</h2>
            <p>${error.message || 'An error occurred'}</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
  });

  // GET CONNECTION STATUS
  fastify.get(
    '/api/calendar/status',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;

      try {
        const status = await getConnectionStatus(userId);

        return {
          success: true,
          data: status,
        };
      } catch (error: any) {
        logger.error('[API] Error getting calendar status:', error);
        throw error;
      }
    }
  );

  // DISCONNECT CALENDAR
  fastify.delete(
    '/api/calendar/disconnect',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;

      try {
        await disconnectCalendar(userId);

        return {
          success: true,
          message: 'Google Calendar disconnected',
        };
      } catch (error: any) {
        logger.error('[API] Error disconnecting calendar:', error);
        throw error;
      }
    }
  );

  // ============================================
  // SYNC OPERATIONS
  // ============================================

  // TRIGGER FULL SYNC
  fastify.post(
    '/api/calendar/sync',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;

      try {
        const result = await fullSync(userId);

        return {
          success: true,
          data: {
            pushed: result.pushed,
            pulled: result.pulled,
          },
        };
      } catch (error: any) {
        logger.error('[API] Error syncing calendar:', error);
        throw error;
      }
    }
  );

  // ============================================
  // LOCAL EVENTS CRUD
  // ============================================

  // GET LOCAL EVENTS
  fastify.get(
    '/api/calendar/local-events',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

      try {
        const events = await getLocalEvents(userId, {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });

        return {
          success: true,
          data: events,
        };
      } catch (error: any) {
        logger.error('[API] Error getting local events:', error);
        throw error;
      }
    }
  );

  // CREATE LOCAL EVENT
  fastify.post(
    '/api/calendar/local-events',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;

      try {
        const body = createLocalEventSchema.parse(request.body);
        const event = await createLocalEvent(userId, body);

        logger.info(`[API] Created local event for user ${userId}`);

        return {
          success: true,
          data: event,
        };
      } catch (error: any) {
        logger.error('[API] Error creating local event:', error);
        throw error;
      }
    }
  );

  // UPDATE LOCAL EVENT
  fastify.put(
    '/api/calendar/local-events/:id',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;
      const { id } = request.params as { id: string };

      try {
        const body = updateLocalEventSchema.parse(request.body);
        const event = await updateLocalEvent(userId, id, body);

        return {
          success: true,
          data: event,
        };
      } catch (error: any) {
        logger.error('[API] Error updating local event:', error);
        throw error;
      }
    }
  );

  // DELETE LOCAL EVENT
  fastify.delete(
    '/api/calendar/local-events/:id',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, _reply) => {
      const userId = request.user.id;
      const { id } = request.params as { id: string };

      try {
        await deleteLocalEvent(userId, id);

        return {
          success: true,
          message: 'Event deleted',
        };
      } catch (error: any) {
        logger.error('[API] Error deleting local event:', error);
        throw error;
      }
    }
  );

  // ============================================
  // LEGACY ENDPOINTS (backward compatibility)
  // ============================================

  // CREATE EVENT (legacy - now uses local events)
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

  // LIST UPCOMING EVENTS (legacy - now uses local events)
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
}
