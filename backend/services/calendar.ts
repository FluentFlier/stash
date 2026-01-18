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

    const event = {
      summary: eventData.title,
      description: eventData.description,
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
