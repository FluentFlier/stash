import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { addCaptureJob } from '../services/queue.js';
import { z } from 'zod';

const webhookSchema = z.object({
  source: z.string().optional().default('webhook'),
  content: z.string(),
  type: z.enum(['LINK', 'TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'PDF', 'DOCUMENT', 'OTHER']).optional().default('TEXT'),
  metadata: z.record(z.any()).optional(),
  api_key: z.string().optional(), // Simple API key check
});

export async function webhookRoutes(fastify: FastifyInstance) {
  // GENERIC WEBHOOK INGESTION
  fastify.post(
    '/api/webhooks/ingest',
    async (request, reply) => {
      try {
        const body = webhookSchema.parse(request.body);

        // Basic API Key validation (if provided in body or headers)
        // Ideally, this should be a robust API key system, but for now we check against env
        const _providedKey = body.api_key || (request.headers['x-api-key'] as string);

        // If we want to secure webhooks, we'd need a mechanism to map keys to users.
        // For this hackathon/MVP scope, we will assume a query param ?userId=... 
        // OR a specific header. Let's use a query param for simplicity in integration.
        const { userId } = request.query as { userId?: string };

        if (!userId) {
          return reply.code(400).send({ success: false, error: 'Missing userId query parameter' });
        }

        // Verify user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return reply.code(404).send({ success: false, error: 'User not found' });
        }

        // Create capture
        const capture = await prisma.capture.create({
          data: {
            userId,
            type: body.type,
            content: body.content,
            userInput: `Via Webhook (${body.source})`,
            metadata: body.metadata || { source: body.source },
            processingStatus: 'pending',
          },
        });

        logger.info(`[Webhook] Created capture ${capture.id} for user ${userId} from ${body.source}`);

        // Queue for processing
        await addCaptureJob(capture.id, userId);

        return {
          success: true,
          captureId: capture.id,
          message: 'Content received and queued',
        };

      } catch (error: any) {
        logger.error('[Webhook] Error processing webhook:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Invalid webhook payload',
        });
      }
    }
  );
}
