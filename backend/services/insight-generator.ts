
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { searchMemories } from './supermemory.js';
// Using generateChatCompletion from ai.ts for the LLM call
import { generateChatCompletion } from './ai.js';

export class InsightGenerator {

    /**
     * Generate a Daily Digest for a user
     * Aggregates recent captures and finds connections via Supermemory
     */
    async generateDailyDigest(userId: string): Promise<void> {
        logger.info(`[InsightGenerator] Generating daily digest for user ${userId}`);

        // 1. Get recent captures (last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentCaptures = await prisma.capture.findMany({
            where: {
                userId,
                createdAt: { gte: yesterday }
            },
            include: { tags: { include: { tag: true } } }
        });

        if (recentCaptures.length === 0) {
            logger.info(`[InsightGenerator] No recent captures for user ${userId}, skipping digest.`);
            return;
        }

        // 2. Format captures for context
        const captureSummaries = recentCaptures.map(c => {
            const type = c.type;
            const tags = c.tags.map(t => t.tag.name).join(', ');
            // Try to get summary from analysis json if available
            const analysis = c.analysis as any;
            const summary = analysis?.description || c.content.substring(0, 100);
            return `- [${type.toUpperCase()}] ${summary} (Tags: ${tags})`;
        }).join('\n');

        // 3. Query Supermemory for broad connections
        // We ask Supermemory: "What relates to these recent topics?"
        // Extract unique tags/topics first
        const topics = Array.from(new Set(recentCaptures.flatMap(c => c.tags.map(t => t.tag.name))));
        const query = `Context related to: ${topics.join(', ')}`;

        let supermemoryContext = "";
        try {
            const memories = await searchMemories({
                query: query,
                userId,
                limit: 5
            });
            supermemoryContext = memories.map(m => m.content).join('\n\n');
        } catch (e) {
            logger.warn(`[InsightGenerator] Failed to fetch context from Supermemory: ${e}`);
        }

        // 4. Generate Insight via LLM
        const prompt = `
    You are an intelligent knowledge assistant. 
    
    Here is what the user captured in the last 24 hours:
    ${captureSummaries}
    
    Here is relevant past context from their Supermemory:
    ${supermemoryContext}
    
    Generate a "Daily Insight" that:
    1. Summarizes the key themes of today's captures.
    2. Highlights any interesting connections to past memories.
    3. Suggests a "Actionable Idea" or "Thought" based on this combination.
    
    Format nicely in Markdown.
    `;

        try {
            const insightContent = await generateChatCompletion([
                { role: 'system', content: 'You are a helpful knowledge assistant.' },
                { role: 'user', content: prompt }
            ], userId);

            // 5. Save to Insight table
            await prisma.insight.create({
                data: {
                    userId,
                    type: 'daily_digest',
                    title: `Daily Insight: ${new Date().toLocaleDateString()}`,
                    content: insightContent,
                    metadata: {
                        sourceCaptureIds: recentCaptures.map(c => c.id)
                    }
                }
            });

            logger.info(`[InsightGenerator] Daily digest created for user ${userId}`);

        } catch (error) {
            logger.error(`[InsightGenerator] Failed to generate insight: ${error}`);
        }
    }
}

export const insightGenerator = new InsightGenerator();
