import { google } from 'googleapis';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

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

    // Update user's google calendar connected status
    await prisma.user.update({
      where: { id: userId },
      data: { googleCalendarConnected: true },
    });

    logger.info(`[Calendar] Stored Google Calendar tokens for user ${userId}`);
  } catch (error) {
    logger.error('[Calendar] Error exchanging code for tokens:', error);
    throw error;
  }
}

/**
 * Check if user has Google Calendar connected
 */
export async function getConnectionStatus(userId: string): Promise<{
  connected: boolean;
  provider?: string;
  expiresAt?: Date;
}> {
  const tokenData = await prisma.calendarToken.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: 'google',
      },
    },
  });

  return {
    connected: !!tokenData,
    provider: tokenData ? 'google' : undefined,
    expiresAt: tokenData?.expiresAt,
  };
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectCalendar(userId: string): Promise<void> {
  await prisma.calendarToken.deleteMany({
    where: { userId, provider: 'google' },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { googleCalendarConnected: false },
  });

  logger.info(`[Calendar] Disconnected Google Calendar for user ${userId}`);
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

// ============================================
// LOCAL EVENT CRUD OPERATIONS
// ============================================

/**
 * Get all local calendar events for user
 */
export async function getLocalEvents(
  userId: string,
  options?: { startDate?: Date; endDate?: Date }
): Promise<any[]> {
  const where: any = { userId };

  if (options?.startDate || options?.endDate) {
    where.startTime = {};
    if (options.startDate) {
      where.startTime.gte = options.startDate;
    }
    if (options.endDate) {
      where.startTime.lte = options.endDate;
    }
  }

  return prisma.calendarEvent.findMany({
    where,
    orderBy: { startTime: 'asc' },
  });
}

/**
 * Create a local calendar event
 */
export async function createLocalEvent(
  userId: string,
  eventData: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    isAllDay?: boolean;
  }
): Promise<any> {
  const event = await prisma.calendarEvent.create({
    data: {
      userId,
      title: eventData.title,
      description: eventData.description,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      location: eventData.location,
      isAllDay: eventData.isAllDay ?? false,
      syncStatus: 'pending',
    },
  });

  logger.info(`[Calendar] Created local event ${event.id} for user ${userId}`);

  // Try to sync to Google Calendar if connected
  try {
    await syncEventToGoogle(userId, event.id);
  } catch (error) {
    logger.warn(`[Calendar] Could not sync event to Google: ${error}`);
    // Event is still created locally, sync will happen later
  }

  return prisma.calendarEvent.findUnique({ where: { id: event.id } });
}

/**
 * Update a local calendar event
 */
export async function updateLocalEvent(
  userId: string,
  eventId: string,
  eventData: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    isAllDay?: boolean;
  }
): Promise<any> {
  // Verify event belongs to user
  const existing = await prisma.calendarEvent.findFirst({
    where: { id: eventId, userId },
  });

  if (!existing) {
    throw new Error('Event not found');
  }

  const updated = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      title: eventData.title,
      description: eventData.description,
      startTime: eventData.startTime ? new Date(eventData.startTime) : undefined,
      endTime: eventData.endTime ? new Date(eventData.endTime) : undefined,
      location: eventData.location,
      isAllDay: eventData.isAllDay,
      syncStatus: 'pending', // Mark as needing sync
    },
  });

  // Try to sync to Google Calendar if connected
  try {
    await syncEventToGoogle(userId, eventId);
  } catch (error) {
    logger.warn(`[Calendar] Could not sync updated event to Google: ${error}`);
  }

  return updated;
}

/**
 * Delete a local calendar event
 */
export async function deleteLocalEvent(
  userId: string,
  eventId: string
): Promise<void> {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, userId },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Delete from Google Calendar if synced
  if (event.googleEventId) {
    try {
      const calendar = await getCalendarClient(userId);
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: event.googleEventId,
      });
      logger.info(`[Calendar] Deleted event ${event.googleEventId} from Google`);
    } catch (error) {
      logger.warn(`[Calendar] Could not delete event from Google: ${error}`);
    }
  }

  await prisma.calendarEvent.delete({ where: { id: eventId } });
  logger.info(`[Calendar] Deleted local event ${eventId}`);
}

// ============================================
// GOOGLE CALENDAR SYNC OPERATIONS
// ============================================

/**
 * Sync a single local event to Google Calendar
 */
async function syncEventToGoogle(userId: string, eventId: string): Promise<void> {
  const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const calendar = await getCalendarClient(userId);

  const googleEvent = {
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
    start: event.isAllDay
      ? { date: event.startTime.toISOString().split('T')[0] }
      : { dateTime: event.startTime.toISOString(), timeZone: 'UTC' },
    end: event.isAllDay
      ? { date: event.endTime.toISOString().split('T')[0] }
      : { dateTime: event.endTime.toISOString(), timeZone: 'UTC' },
  };

  let googleEventId = event.googleEventId;

  if (googleEventId) {
    // Update existing event
    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: googleEvent,
    });
  } else {
    // Create new event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });
    googleEventId = response.data.id || null;
  }

  // Update local event with sync status
  await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      googleEventId,
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
    },
  });

  logger.info(`[Calendar] Synced event ${eventId} to Google (${googleEventId})`);
}

/**
 * Pull events from Google Calendar and merge with local events
 */
export async function pullGoogleEvents(userId: string): Promise<{
  added: number;
  updated: number;
}> {
  let added = 0;
  let updated = 0;

  try {
    const calendar = await getCalendarClient(userId);

    // Get events from Google Calendar
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: threeMonthsAgo.toISOString(),
      timeMax: threeMonthsLater.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const googleEvents = response.data.items || [];

    for (const gEvent of googleEvents) {
      if (!gEvent.id || !gEvent.summary) continue;

      // Check if we already have this event locally
      const existing = await prisma.calendarEvent.findFirst({
        where: { userId, googleEventId: gEvent.id },
      });

      const isAllDay = !!gEvent.start?.date;
      const startTime = new Date(gEvent.start?.dateTime || gEvent.start?.date || '');
      const endTime = new Date(gEvent.end?.dateTime || gEvent.end?.date || '');

      if (existing) {
        // Update existing local event
        await prisma.calendarEvent.update({
          where: { id: existing.id },
          data: {
            title: gEvent.summary,
            description: gEvent.description || null,
            startTime,
            endTime,
            location: gEvent.location || null,
            isAllDay,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          },
        });
        updated++;
      } else {
        // Create new local event from Google
        await prisma.calendarEvent.create({
          data: {
            userId,
            googleEventId: gEvent.id,
            title: gEvent.summary,
            description: gEvent.description || null,
            startTime,
            endTime,
            location: gEvent.location || null,
            isAllDay,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          },
        });
        added++;
      }
    }

    logger.info(`[Calendar] Pulled Google events: ${added} added, ${updated} updated`);
  } catch (error) {
    logger.error('[Calendar] Error pulling Google events:', error);
    throw error;
  }

  return { added, updated };
}

/**
 * Push all pending local events to Google Calendar
 */
export async function pushPendingEvents(userId: string): Promise<number> {
  const pendingEvents = await prisma.calendarEvent.findMany({
    where: { userId, syncStatus: 'pending' },
  });

  let synced = 0;

  for (const event of pendingEvents) {
    try {
      await syncEventToGoogle(userId, event.id);
      synced++;
    } catch (error) {
      logger.error(`[Calendar] Error syncing event ${event.id}:`, error);
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { syncStatus: 'error' },
      });
    }
  }

  logger.info(`[Calendar] Pushed ${synced} pending events to Google`);
  return synced;
}

/**
 * Full bidirectional sync
 */
export async function fullSync(userId: string): Promise<{
  pushed: number;
  pulled: { added: number; updated: number };
}> {
  // First push local changes to Google
  const pushed = await pushPendingEvents(userId);

  // Then pull Google changes to local
  const pulled = await pullGoogleEvents(userId);

  return { pushed, pulled };
}

// ============================================
// LEGACY: Direct Google Calendar operations (for backward compatibility)
// ============================================

/**
 * Create calendar event directly in Google (legacy)
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
  // Create local event first (which will sync to Google)
  const localEvent = await createLocalEvent(userId, eventData);

  return {
    id: localEvent.id,
    link: localEvent.googleEventId
      ? `https://calendar.google.com/calendar/event?eid=${localEvent.googleEventId}`
      : '',
  };
}

/**
 * List upcoming events (legacy - now returns local events)
 */
export async function listUpcomingEvents(
  userId: string,
  maxResults: number = 10
): Promise<any[]> {
  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: 'asc' },
    take: maxResults,
  });

  // Transform to match expected format
  return events.map((event) => ({
    id: event.id,
    summary: event.title,
    description: event.description,
    htmlLink: event.googleEventId
      ? `https://calendar.google.com/calendar/event?eid=${event.googleEventId}`
      : null,
    start: event.isAllDay
      ? { date: event.startTime.toISOString().split('T')[0] }
      : { dateTime: event.startTime.toISOString() },
    end: event.isAllDay
      ? { date: event.endTime.toISOString().split('T')[0] }
      : { dateTime: event.endTime.toISOString() },
    location: event.location,
    syncStatus: event.syncStatus,
  }));
}
