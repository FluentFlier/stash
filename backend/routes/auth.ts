import { FastifyInstance } from 'fastify';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { authRateLimit } from '../utils/rate-limiting.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Apply strict rate limiting to auth endpoints
  fastify.addHook('preHandler', authRateLimit);

  // Register new user
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      if (!supabase) {
        return reply.code(500).send({
          success: false,
          error: 'Supabase client not configured'
        });
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          data: {
            name: body.name || body.email.split('@')[0],
          }
        }
      });

      if (error) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }

      if (!data.user) {
        return reply.code(500).send({
          success: false,
          error: 'Registration failed'
        });
      }

      logger.info(`[Auth] New user registered: ${data.user.email}`);

      return {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name,
          },
          session: data.session,
        },
      };
    } catch (error: any) {
      logger.error('[Auth] Registration error:', error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid input',
          details: error.errors,
        });
      }

      throw error;
    }
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      if (!supabase) {
        return reply.code(500).send({
          success: false,
          error: 'Supabase client not configured'
        });
      }

      // Login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });

      if (error) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password'
        });
      }

      logger.info(`[Auth] User logged in: ${data.user.email}`);

      return {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name,
          },
          session: data.session,
        },
      };
    } catch (error: any) {
      logger.error('[Auth] Login error:', error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid input',
        });
      }

      throw error;
    }
  });

  // Get current user
  fastify.get(
    '/api/auth/me',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request) => {
      return {
        success: true,
        data: request.user,
      };
    }
  );

  // Update user profile (onboarding metadata)
  fastify.post(
    '/api/auth/onboarding',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      try {
        if (!supabaseAdmin) {
          return reply.code(500).send({
            success: false,
            error: 'Supabase admin client not configured'
          });
        }

        const userId = request.user.id;
        const body = z.object({
          name: z.string().optional(),
          role: z.string().optional(),
          age: z.number().optional(),
          notificationsEnabled: z.boolean().optional(),
          googleCalendarConnected: z.boolean().optional(),
        }).parse(request.body);

        // Update profile in Supabase
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            name: body.name,
            role: body.role,
            age: body.age,
            notifications_enabled: body.notificationsEnabled,
            google_calendar_connected: body.googleCalendarConnected,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          logger.error('[Auth] Profile update error:', error);
          return reply.code(500).send({
            success: false,
            error: 'Failed to update profile'
          });
        }

        logger.info(`[Auth] Profile updated for user ${userId}`);

        return {
          success: true,
          data,
        };
      } catch (error: any) {
        logger.error('[Auth] Onboarding error:', error);

        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            success: false,
            error: 'Invalid input',
          });
        }

        throw error;
      }
    }
  );

  // Logout
  fastify.post(
    '/api/auth/logout',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      try {
        if (!supabase) {
          return reply.code(500).send({
            success: false,
            error: 'Supabase client not configured'
          });
        }

        // Get token from header
        const token = request.headers.authorization?.substring(7);

        if (token) {
          await supabase.auth.signOut();
        }

        return {
          success: true,
          message: 'Logged out successfully',
        };
      } catch (error: any) {
        logger.error('[Auth] Logout error:', error);
        throw error;
      }
    }
  );
}
