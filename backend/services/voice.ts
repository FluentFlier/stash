import { AccessToken } from 'livekit-server-sdk';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Create LiveKit access token for voice session
 */
export async function createVoiceToken(
  userId: string,
  roomName: string
): Promise<{ token: string; url: string }> {
  try {
    if (!config.livekit.apiKey || !config.livekit.apiSecret || !config.livekit.url) {
      throw new Error('LiveKit not configured');
    }

    const token = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
      identity: userId,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = token.toJwt();

    logger.info(`[Voice] Created token for user ${userId} in room ${roomName}`);

    return {
      token: jwt,
      url: config.livekit.url,
    };
  } catch (error: any) {
    logger.error('[Voice] Error creating token:', error);
    throw new Error(`Failed to create voice token: ${error.message}`);
  }
}

/**
 * Create a new voice room
 */
export async function createVoiceRoom(userId: string): Promise<{ roomName: string; token: string; url: string }> {
  try {
    const roomName = `stash-voice-${userId}-${Date.now()}`;
    const tokenData = await createVoiceToken(userId, roomName);

    return {
      roomName,
      ...tokenData,
    };
  } catch (error: any) {
    logger.error('[Voice] Error creating room:', error);
    throw new Error(`Failed to create voice room: ${error.message}`);
  }
}
