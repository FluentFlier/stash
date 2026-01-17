import admin from 'firebase-admin';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let firebaseInitialized = false;

// Initialize Firebase Admin SDK (for push notifications ONLY - NO SMS)
export function initializeFirebase() {
  if (firebaseInitialized) {
    return admin.app();
  }

  try {
    // Only initialize if all required Firebase env vars are present
    if (
      !config.firebase.projectId ||
      !config.firebase.privateKey ||
      !config.firebase.clientEmail
    ) {
      logger.warn(
        '[Firebase] ⚠️  Firebase credentials not configured - Push notifications will be disabled'
      );
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
      }),
    });

    firebaseInitialized = true;
    logger.info('[Firebase] ✅ Firebase Admin SDK initialized');
    return admin.app();
  } catch (error) {
    logger.error('[Firebase] ❌ Failed to initialize Firebase:', error);
    return null;
  }
}

// Get Firebase Messaging instance
export function getMessaging() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return firebaseInitialized ? admin.messaging() : null;
}

export { admin };
