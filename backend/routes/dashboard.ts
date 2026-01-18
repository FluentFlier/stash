import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/api/dashboard',
        {
            preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
        },
        async (request, _reply) => {
            const userId = request.user.id;

            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // 1. Today's Stats
                const itemsSavedToday = await prisma.capture.count({
                    where: { userId, createdAt: { gte: today } }
                });

                // AI Queries (Chat messages from user today)
                const aiQueriesToday = await prisma.chatMessage.count({
                    where: { userId, role: 'user', createdAt: { gte: today } }
                });

                // Pending Reminders (Upcoming)
                const pendingRemindersCount = await prisma.reminder.count({
                    where: { userId, status: 'pending' }
                });

                // 2. Upcoming Actions (Reminders + Insights)
                const upcomingReminders = await prisma.reminder.findMany({
                    where: { userId, status: 'pending', scheduledAt: { gte: new Date() } },
                    orderBy: { scheduledAt: 'asc' },
                    take: 3,
                    include: { capture: { select: { title: true } } }
                });

                const actionInsights = await prisma.insight.findMany({
                    where: { userId, type: 'ACTION_ITEM', isRead: false },
                    orderBy: { createdAt: 'desc' },
                    take: 3
                });

                // Combine and map to unified format
                const upcomingActions = [
                    ...upcomingReminders.map(r => ({
                        id: r.id,
                        title: r.message,
                        time: r.scheduledAt,
                        type: 'reminder',
                        source: 'Reminder'
                    })),
                    ...actionInsights.map(i => ({
                        id: i.id,
                        title: i.title,
                        time: i.createdAt, // Or metadata date
                        type: 'action',
                        source: 'AI Insight'
                    }))
                ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).slice(0, 5);

                // 3. Recent Topics (Tags)
                // This requires parsing tags. Simplest is showing most used tags recently.
                // Prisma doesn't do group by on related tables easily.
                // We fetch recent captures and extract tags.
                const recentCaptures = await prisma.capture.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: { tags: { include: { tag: true } } }
                });

                const tagCounts: Record<string, number> = {};
                recentCaptures.forEach(c => {
                    c.tags.forEach(ct => {
                        const tagName = ct.tag.name;
                        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
                    });
                });

                const recentTopics = Object.entries(tagCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([name, count]) => ({ id: name, name, count, trend: '' }));

                // 4. Weekly Activity (Real)
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    d.setHours(0, 0, 0, 0);
                    return d;
                });

                const weeklyProgress = await Promise.all(last7Days.map(async (date) => {
                    const nextDate = new Date(date);
                    nextDate.setDate(date.getDate() + 1);

                    const count = await prisma.capture.count({
                        where: {
                            userId,
                            createdAt: { gte: date, lt: nextDate }
                        }
                    });

                    return {
                        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        value: count
                    };
                }));

                // 5. AI Digest (Latest Summary)
                const latestDigest = await prisma.insight.findFirst({
                    where: { userId, type: { in: ['DAILY_SUMMARY', 'WEEKLY_SUMMARY'] } },
                    orderBy: { createdAt: 'desc' }
                });

                const aiDigest = latestDigest ? {
                    summary: latestDigest.content,
                    highlights: latestDigest.metadata && typeof latestDigest.metadata === 'object' && 'highlights' in latestDigest.metadata
                        ? (latestDigest.metadata as any).highlights
                        : []
                } : null;

                // 6. Total Counts (For Profile)
                const totalItems = await prisma.capture.count({ where: { userId } });
                const totalChats = await prisma.chatMessage.count({ where: { userId, role: 'USER' } });

                return {
                    success: true,
                    data: {
                        todayStats: {
                            itemsSaved: itemsSavedToday,
                            aiQueries: aiQueriesToday,
                            eventsDetected: upcomingActions.length, // Proxy
                            timeSpent: '12m' // Still Mock (requires tracking)
                        },
                        totals: {
                            items: totalItems,
                            chats: totalChats
                        },
                        upcomingActions,
                        recentTopics,
                        weeklyProgress,
                        aiDigest
                    }
                };

            } catch (error: any) {
                logger.error('[API] Error fetching dashboard:', error);
                throw error;
            }
        }
    );
}
