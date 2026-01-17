import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// Prisma Client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
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
