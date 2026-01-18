
import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { insightGenerator } from '../services/insight-generator.js';

export async function insightRoutes(fastify: FastifyInstance) {
    // Get all insights for the user
    fastify.get('/api/insights', {
        preHandler: [(fastify as any).authenticate],
    }, async (request, reply) => {
        const user = request.user as any;

        try {
            const insights = await prisma.insight.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            return { success: true, insights };
        } catch (error) {
            logger.error(`[API] Failed to fetch insights: ${error}`);
            return reply.status(500).send({ success: false, error: 'Internal Server Error' });
        }
    });

    // Manually trigger insight generation (e.g. for testing or "Refresh Digest")
    fastify.post('/api/insights/generate', {
        preHandler: [(fastify as any).authenticate],
    }, async (request, reply) => {
        const user = request.user as any;

        try {
            // Trigger generic daily digest for now
            // We catch validation errors internally inside the service if any
            await insightGenerator.generateDailyDigest(user.id);

            // Fetch the newly created one to return immediately?
            // Or just return success.
            return { success: true, message: 'Insight generation triggered' };
        } catch (error) {
            logger.error(`[API] Failed to generate insight: ${error}`);
            return reply.status(500).send({ success: false, error: 'Internal Server Error' });
        }
    });

    // Mark an insight as read
    fastify.patch('/api/insights/:id/read', {
        preHandler: [(fastify as any).authenticate],
    }, async (request, reply) => {
        const { id } = request.params as any;
        const user = request.user as any;

        try {
            await prisma.insight.update({
                where: { id, userId: user.id },
                data: { isRead: true }
            });
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false });
        }
    });
}
