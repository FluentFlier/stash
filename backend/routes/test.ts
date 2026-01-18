import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';

export async function testRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/api/test/notification',
        async (request, reply) => {
            try {
                const user = await prisma.user.findFirst();
                if (!user) return { success: false, error: 'No user found' };

                const insight = await prisma.insight.create({
                    data: {
                        userId: user.id,
                        type: 'NOTIFICATION',
                        title: 'Test Notification (Via API) 🚀',
                        content: 'This proves the notification system works end-to-end!',
                        isRead: false,
                        metadata: {
                            action: 'OPEN_APP'
                        }
                    }
                });

                return { success: true, message: 'Sent', id: insight.id };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        }
    );
}
