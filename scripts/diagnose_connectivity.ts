import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

async function check() {
    console.log('--- DIAGNOSTICS ---');

    // DB (Standard)
    try {
        console.log('Checking Database connection (Standard)...');
        console.log('URL:', process.env.DATABASE_URL?.replace(/:[^:]+@/, ':***@'));
        const client = new PrismaClient();
        await client.$connect();
        const count = await client.user.count();
        console.log('✅ DB Standard Connected. User count:', count);
        await client.$disconnect();
    } catch (e: any) {
        console.log('❌ DB Standard Connection Failed:', e.message);
    }

    // DB (Direct)
    try {
        console.log('Checking Database connection (Using DIRECT_URL)...');
        console.log('URL:', process.env.DIRECT_URL?.replace(/:[^:]+@/, ':***@'));
        // Create new client with DIRECT_URL
        const directPrisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DIRECT_URL
                }
            }
        });
        await directPrisma.$connect();
        const count = await directPrisma.user.count();
        console.log('✅ DB Direct Connected. User count:', count);
        await directPrisma.$disconnect();
    } catch (e: any) {
        console.log('❌ DB Direct Connection Failed:', e.message);
    }

    // Redis
    try {
        console.log('Checking Redis connection...');
        // console.log('URL:', process.env.REDIS_URL?.replace(/:[^:]+@/, ':***@'));
        const redis = new Redis(process.env.REDIS_URL || '', {
            showFriendlyErrorStack: true,
            connectTimeout: 5000,
            maxRetriesPerRequest: 1
        });

        // Wait for connect
        await new Promise((resolve, reject) => {
            redis.on('ready', resolve);
            redis.on('error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        await redis.set('test', 'ok');
        const val = await redis.get('test');
        console.log('✅ Redis Connected. Value:', val);
        redis.disconnect();
    } catch (e: any) {
        console.log('❌ Redis Connection Failed:', e.message);
    }

    process.exit(0);
}

check();
