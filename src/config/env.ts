import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema with Zod validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_URL: z.string().url().default('http://localhost:3000'),

  // Database (Supabase PostgreSQL)
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // Redis (Cache + Queue)
  REDIS_URL: z.string().url(),

  // AI / LLM (Supermemory proxy)
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  SUPERMEMORY_API_KEY: z.string().min(1),
  SUPERMEMORY_BASE_URL: z.string().url().optional(),

  // Jina AI (Link content extraction)
  JINA_API_KEY: z.string().min(1),

  // Google Calendar
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  // Firebase (Push Notifications - NO SMS)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),

  // LiveKit (Voice)
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  LIVEKIT_URL: z.string().url().optional(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Agent Configuration
  AGENT_MAX_REASONING_STEPS: z.string().default('5'),
  AGENT_CONFIDENCE_THRESHOLD: z.string().default('0.7'),
  ENABLE_PROACTIVE_AGENT: z.string().default('true'),
  PROACTIVE_AGENT_INTERVAL_HOURS: z.string().default('1'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

// Typed environment configuration
export const config = {
  server: {
    nodeEnv: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    apiUrl: env.API_URL,
  },
  database: {
    url: env.DATABASE_URL,
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceKey: env.SUPABASE_SERVICE_KEY,
  },
  redis: {
    url: env.REDIS_URL,
  },
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    supermemoryApiKey: env.SUPERMEMORY_API_KEY,
    supermemoryBaseUrl: env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai/v3/https://api.openai.com/v1',
    jinaApiKey: env.JINA_API_KEY,
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  },
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
  },
  livekit: {
    apiKey: env.LIVEKIT_API_KEY,
    apiSecret: env.LIVEKIT_API_SECRET,
    url: env.LIVEKIT_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },
  agent: {
    maxReasoningSteps: parseInt(env.AGENT_MAX_REASONING_STEPS, 10),
    confidenceThreshold: parseFloat(env.AGENT_CONFIDENCE_THRESHOLD),
    enableProactiveAgent: env.ENABLE_PROACTIVE_AGENT === 'true',
    proactiveAgentIntervalHours: parseInt(env.PROACTIVE_AGENT_INTERVAL_HOURS, 10),
  },
} as const;
