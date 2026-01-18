import { google } from 'googleapis';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { addReminderJob } from './queue.js';

/**
 * Get OAuth2 client for Google Calendar
 */
function getOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

/**
 * Get authorization URL for Google Calendar OAuth
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();

  const scopes = ['https://www.googleapis.com/auth/calendar'];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  userId: string
): Promise<void> {
  try {
    const oauth2Client = getOAuth2Client();

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Invalid tokens received');
    }

    // Store tokens in database
    await prisma.calendarToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
      create: {
        userId,
        provider: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      },
    });

    logger.info(`[Calendar] Stored Google Calendar tokens for user ${userId}`);
  } catch (error) {
    logger.error('[Calendar] Error exchanging code for tokens:', error);
    throw error;
  }
}

/**
 * Get authenticated calendar client for user
 */
async function getCalendarClient(userId: string) {
  const tokenData = await prisma.calendarToken.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: 'google',
      },
    },
  });

  if (!tokenData) {
    throw new Error('No calendar token found for user');
  }

  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken,
    expiry_date: tokenData.expiresAt.getTime(),
  });

  // Refresh token if expired
  if (tokenData.expiresAt < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    // Update tokens in database
    if (credentials.access_token && credentials.expiry_date) {
      await prisma.calendarToken.update({
        where: {
          userId_provider: {
            userId,
            provider: 'google',
          },
        },
        data: {
          accessToken: credentials.access_token,
          expiresAt: new Date(credentials.expiry_date),
        },
      });
    }
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create calendar event
 */
export async function createCalendarEvent(
  userId: string,
  eventData: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendees?: string[];
  }
): Promise<{ id: string; link: string }> {
  try {
    const calendar = await getCalendarClient(userId);

    // Add Stash marker to description to identify Stash-created events
    const stashMarker = '\n\n[Stash]';
    const description = eventData.description 
      ? `${eventData.description}${stashMarker}`
      : stashMarker;

    const event = {
      summary: eventData.title,
      description,
      location: eventData.location,
      start: {
        dateTime: eventData.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'UTC',
      },
      attendees: eventData.attendees?.map((email) => ({ email })),
      extendedProperties: {
        private: {
          stash: 'true',
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    if (!response.data.id || !response.data.htmlLink) {
      throw new Error('Failed to create calendar event');
    }

    logger.info(`[Calendar] Created event ${response.data.id} for user ${userId}`);

    return {
      id: response.data.id,
      link: response.data.htmlLink,
    };
  } catch (error: any) {
    logger.error('[Calendar] Error creating event:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * List upcoming events
 */
export async function listUpcomingEvents(
  userId: string,
  maxResults: number = 10
): Promise<any[]> {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    logger.error('[Calendar] Error listing events:', error);
    return [];
  }
}

/**
 * Check if user has calendar connected
 */
export async function hasCalendarConnected(userId: string): Promise<boolean> {
  try {
    const tokenData = await prisma.calendarToken.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
    });
    return !!tokenData;
  } catch (error) {
    return false;
  }
}

/**
 * Get a specific calendar event
 */
export async function getCalendarEvent(
  userId: string,
  eventId: string
): Promise<any | null> {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    return response.data;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    logger.error('[Calendar] Error getting event:', error);
    throw error;
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  eventData: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    attendees?: string[];
  }
): Promise<{ id: string; link: string }> {
  try {
    const calendar = await getCalendarClient(userId);

    // Get existing event first
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    if (!existingEvent.data) {
      throw new Error('Event not found');
    }

    // Build update object
    const updatedEvent: any = {
      ...existingEvent.data,
    };

    if (eventData.title) updatedEvent.summary = eventData.title;
    if (eventData.description !== undefined) updatedEvent.description = eventData.description;
    if (eventData.location !== undefined) updatedEvent.location = eventData.location;
    if (eventData.startTime) {
      updatedEvent.start = {
        dateTime: eventData.startTime,
        timeZone: 'UTC',
      };
    }
    if (eventData.endTime) {
      updatedEvent.end = {
        dateTime: eventData.endTime,
        timeZone: 'UTC',
      };
    }
    if (eventData.attendees) {
      updatedEvent.attendees = eventData.attendees.map((email) => ({ email }));
    }

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: updatedEvent,
    });

    if (!response.data.id || !response.data.htmlLink) {
      throw new Error('Failed to update calendar event');
    }

    logger.info(`[Calendar] Updated event ${eventId} for user ${userId}`);

    return {
      id: response.data.id,
      link: response.data.htmlLink,
    };
  } catch (error: any) {
    logger.error('[Calendar] Error updating event:', error);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<void> {
  try {
    const calendar = await getCalendarClient(userId);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    logger.info(`[Calendar] Deleted event ${eventId} for user ${userId}`);
  } catch (error: any) {
    if (error.code === 404) {
      // Event already deleted, that's fine
      logger.info(`[Calendar] Event ${eventId} already deleted`);
      return;
    }
    logger.error('[Calendar] Error deleting event:', error);
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

/**
 * Sync calendar events to reminders
 * Fetches recent calendar events and creates/updates corresponding reminders
 */
export async function syncCalendarEventsToReminders(userId: string): Promise<{
  created: number;
  updated: number;
  errors: number;
}> {
  const stats = { created: 0, updated: 0, errors: 0 };

  try {
    const calendar = await getCalendarClient(userId);

    // Fetch events from last 24 hours to 7 days in the future
    const timeMin = new Date();
    timeMin.setHours(timeMin.getHours() - 24);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    logger.info(`[Calendar] Syncing ${events.length} events for user ${userId}`);

    for (const event of events) {
      try {
        if (!event.id || !event.start || !event.summary) {
          continue; // Skip invalid events
        }

        const startTime = event.start.dateTime || event.start.date;
        if (!startTime) {
          continue;
        }

        // Check if reminder already exists for this calendar event
        const existingReminder = await prisma.reminder.findFirst({
          where: {
            userId,
            calendarEventId: event.id,
          },
        });

        const scheduledAt = new Date(startTime);
        const endTime = event.end?.dateTime || event.end?.date;
        const endDateTime = endTime ? new Date(endTime) : new Date(scheduledAt.getTime() + 3600000); // Default 1 hour

        // Build description with event details
        let description = event.description || '';
        if (event.location) {
          description += `\n\nLocation: ${event.location}`;
        }
        if (event.attendees && event.attendees.length > 0) {
          const attendeeEmails = event.attendees
            .map((a) => a.email)
            .filter(Boolean)
            .join(', ');
          if (attendeeEmails) {
            description += `\n\nAttendees: ${attendeeEmails}`;
          }
        }

        if (existingReminder) {
          // Update existing reminder
          await prisma.reminder.update({
            where: { id: existingReminder.id },
            data: {
              message: event.summary,
              scheduledAt,
              syncedAt: new Date(),
            },
          });
          stats.updated++;
        } else {
          // Check if this is a Stash-created event (has marker in description)
          const isStashEvent = description.includes('[Stash]') || 
                               event.extendedProperties?.private?.stash === 'true';

          // Only create reminder if it's not a Stash-created event
          // (to avoid circular sync - Stash events are already reminders)
          if (!isStashEvent) {
            // Create new reminder
            const reminder = await prisma.reminder.create({
              data: {
                userId,
                message: event.summary,
                scheduledAt,
                status: 'PENDING',
                calendarEventId: event.id,
                calendarProvider: 'google',
                syncedAt: new Date(),
              },
            });

            // Add to reminder queue
            await addReminderJob(reminder.id, scheduledAt);

            stats.created++;
          }
        }
      } catch (error: any) {
        logger.error(`[Calendar] Error syncing event ${event.id}:`, error);
        stats.errors++;
      }
    }

    logger.info(
      `[Calendar] Sync complete for user ${userId}: ${stats.created} created, ${stats.updated} updated, ${stats.errors} errors`
    );

    return stats;
  } catch (error: any) {
    logger.error(`[Calendar] Error syncing calendar events for user ${userId}:`, error);
    throw error;
  }
}
