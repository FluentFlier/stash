import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export async function notificationRoutes(fastify: FastifyInstance) {
    // GET UNREAD NOTIFICATIONS
    fastify.get(
        '/api/notifications',
        {
            preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
        },
        async (request, _reply) => {
            const userId = request.user.id;

            try {
                const insights = await prisma.insight.findMany({
                    where: {
                        userId,
                        type: 'NOTIFICATION', // Filter for notifications specifically
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50, // Limit to last 50
                });

                // Count unread
                const unreadCount = await prisma.insight.count({
                    where: { userId, type: 'NOTIFICATION', isRead: false }
                });

                return {
                    success: true,
                    data: insights,
                    meta: { unreadCount }
                };
            } catch (error: any) {
                logger.error('[API] Error fetching notifications:', error);
                throw error;
            }
        }
    );

    // MARK AS READ
    fastify.post(
        '/api/notifications/:id/read',
        {
            preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
        },
        async (request, reply) => {
            const { id } = request.params as { id: string };
            const userId = request.user.id;

            try {
                // Verify ownership
                const insight = await prisma.insight.findFirst({
                    where: { id, userId }
                });

                if (!insight) {
                    return reply.code(404).send({ success: false, error: 'Notification not found' });
                }

                await prisma.insight.update({
                    where: { id },
                    data: { isRead: true },
                });

                return { success: true, message: 'Marked as read' };
            } catch (error: any) {
                logger.error('[API] Error updating notification:', error);
                throw error;
            }
        }
    );

    // MARK ALL AS READ
    fastify.post(
        '/api/notifications/read-all',
        {
            preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
        },
        async (request, _reply) => {
            const userId = request.user.id;

            try {
                await prisma.insight.updateMany({
                    where: { userId, isRead: false },
                    data: { isRead: true },
                });

                return { success: true, message: 'All marked as read' };
            } catch (error: any) {
                logger.error('[API] Error marking all notifications as read:', error);
                throw error;
            }
        }
    );
}
