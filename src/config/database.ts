import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// Database security configuration
const DATABASE_CONFIG = {
  // Connection limits for security and performance
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'), // 10 seconds
  queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'), // 30 seconds

  // Security settings
  ssl: process.env.NODE_ENV === 'production', // Require SSL in production
  rejectUnauthorized: process.env.NODE_ENV === 'production', // Strict SSL validation

  // Logging (reduced in production for security)
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error', 'warn'], // Remove query logging in production
};

// Prisma Client singleton with security configuration
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: DATABASE_CONFIG.log as any, // Type assertion for log levels
    // Security and performance settings will be handled by connection string
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('[Database] Disconnecting Prisma Client');
  await prisma.$disconnect();
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    logger.info('[Database] ✅ Connected to PostgreSQL (Supabase)');
    return true;
  } catch (error) {
    logger.error('[Database] ❌ Failed to connect to PostgreSQL:', error);
    return false;
  }
}
