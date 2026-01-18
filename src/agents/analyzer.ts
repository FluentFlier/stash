import { Capture } from '@prisma/client';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { analyzeLink } from '../services/link-analyzer.js';
import { analyzeVideo, isYouTubeUrl } from '../services/video-analyzer.js';
import { analyzePdf, isPdfUrl } from '../services/pdf-extractor.js';
import { generateStructuredResponse, generateChatCompletion } from '../services/ai.js';
import { AnalyzerOutput, DeepAnalysis, UserIntent, ReasoningStep } from '../types/agents.js';

/**
 * Analyzer Agent
 * Performs deep content analysis and context understanding
 */
export class AnalyzerAgent {
  /**
   * Main analysis method - coordinates all analysis steps
   */
  async analyze(capture: Capture, userId: string): Promise<AnalyzerOutput> {
    const reasoning: ReasoningStep[] = [];

    try {
      // Step 1: Content-type specific analysis
      logger.info(`[AnalyzerAgent] Starting analysis for capture ${capture.id}`);

      let contentAnalysis: DeepAnalysis;

      if (capture.type === 'LINK') {
        if (isYouTubeUrl(capture.content)) {
          contentAnalysis = await analyzeVideo(capture.content, userId);
          reasoning.push({
            step: 'content_analysis',
            observation: 'Detected YouTube video',
            result: 'Used video transcript extraction',
          });
        } else if (isPdfUrl(capture.content)) {
          contentAnalysis = await analyzePdf(capture.content, userId);
          reasoning.push({
            step: 'content_analysis',
            observation: 'Detected PDF document',
            result: 'Used PDF text extraction',
          });
        } else {
          contentAnalysis = await analyzeLink(capture.content, userId);
          reasoning.push({
            step: 'content_analysis',
            observation: 'Analyzed web link',
            result: 'Used Jina AI content extraction',
          });
        }
      } else if (capture.type === 'TEXT') {
        contentAnalysis = await this.analyzeText(capture.content, userId);
        reasoning.push({
          step: 'content_analysis',
          observation: 'Analyzed text content',
          result: contentAnalysis,
        });
      } else {
        contentAnalysis = await this.analyzeFallback(capture.content, userId);
        reasoning.push({
          step: 'content_analysis',
          observation: `Analyzed ${capture.type} content`,
          result: 'Used fallback analysis',
        });
      }

      // Step 2: Retrieve context from user's history (Supermemory)
      const context = await this.retrieveContext(capture, contentAnalysis, userId);
      reasoning.push({
        step: 'context_retrieval',
        observation: 'Checked user history via Supermemory',
        result: context,
      });

      // Step 3: Understand user intent
      const intent = await this.understandIntent(capture, contentAnalysis, context, userId);
      reasoning.push({
        step: 'intent_understanding',
        observation: `User said: "${capture.userInput || 'N/A'}"`,
        result: intent,
      });

      // Step 4: Find related content
      const relatedContent = await this.findRelatedContent(contentAnalysis, userId);
      reasoning.push({
        step: 'relation_finding',
        observation: `Found ${relatedContent.length} related items`,
        result: relatedContent.map((c) => c.id),
      });

      logger.info(`[AnalyzerAgent] Analysis complete for capture ${capture.id}`);

      return {
        reasoning,
        contentAnalysis,
        context,
        intent,
        relatedContent,
        relatedCount: relatedContent.length,
      };
    } catch (error: any) {
      logger.error(`[AnalyzerAgent] Error analyzing capture ${capture.id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve context from user's history using Supermemory
   */
  private async retrieveContext(
    _capture: Capture,
    contentAnalysis: DeepAnalysis,
    userId: string
  ): Promise<string> {
    try {
      const query = `What do you know about these topics: ${contentAnalysis.topics.join(', ')}?`;

      const context = await generateChatCompletion(
        [
          {
            role: 'system',
            content: 'Summarize relevant context from the user\'s history in 2-3 sentences.',
          },
          { role: 'user', content: query },
        ],
        userId,
        { model: 'gpt-4-turbo-preview', temperature: 0.5 }
      );

      return context;
    } catch (error) {
      logger.error('[AnalyzerAgent] Error retrieving context:', error);
      return 'No previous context found.';
    }
  }

  /**
   * Understand user intent from capture data
   */
  private async understandIntent(
    capture: Capture,
    contentAnalysis: DeepAnalysis,
    context: string,
    userId: string
  ): Promise<UserIntent> {
    try {
      const prompt = `Content: ${JSON.stringify(contentAnalysis)}
User said: "${capture.userInput || 'no input'}"
Context: ${context}`;

      const systemPrompt = `You understand user intent. Return JSON:
{
  "primary_intent": "save_for_later" | "learn" | "research" | "reference" | "share" | "action_required",
  "urgency": "low" | "medium" | "high",
  "category": string,
  "suggested_actions": string[]
}`;

      return await generateStructuredResponse<UserIntent>(prompt, systemPrompt, userId);
    } catch (error) {
      logger.error('[AnalyzerAgent] Error understanding intent:', error);
      return {
        primary_intent: 'save_for_later',
        urgency: 'low',
        category: 'general',
        suggested_actions: [],
      };
    }
  }

  /**
   * Find related content in user's captures
   */
  private async findRelatedContent(
    contentAnalysis: DeepAnalysis,
    userId: string
  ): Promise<Capture[]> {
    try {
      if (!contentAnalysis.topics || contentAnalysis.topics.length === 0) {
        return [];
      }

      // Find captures with overlapping topics
      const related = await prisma.capture.findMany({
        where: {
          userId,
          processingStatus: 'COMPLETED',
          analysis: {
            path: ['topics'],
            array_contains: contentAnalysis.topics[0],
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      return related;
    } catch (error) {
      logger.error('[AnalyzerAgent] Error finding related content:', error);
      return [];
    }
  }

  /**
   * Analyze plain text content
   */
  private async analyzeText(text: string, userId: string): Promise<DeepAnalysis> {
    try {
      const systemPrompt = `Analyze this text and return ONLY valid JSON:
{
  "topics": string[],
  "entities": {
    "people": string[],
    "organizations": string[],
    "technologies": string[],
    "locations": string[]
  },
  "keyTakeaways": string[],
  "actionItems": string[],
  "dates": string[],
  "difficulty": "beginner" | "intermediate" | "advanced"
}`;

      const analysis = await generateStructuredResponse<{
        topics: string[];
        entities: DeepAnalysis['entities'];
        keyTakeaways: string[];
        actionItems: string[];
        dates: string[];
        difficulty: DeepAnalysis['difficulty'];
      }>(`Analyze this text:\n\n${text.slice(0, 5000)}`, systemPrompt, userId);

      return {
        title: text.slice(0, 100),
        description: text.slice(0, 200),
        fullContent: text,
        contentType: 'other',
        ...analysis,
      };
    } catch (error) {
      logger.error('[AnalyzerAgent] Error analyzing text:', error);
      return this.analyzeFallback(text, userId);
    }
  }

  /**
   * Fallback analysis for unsupported content types
   */
  private async analyzeFallback(content: string, _userId: string): Promise<DeepAnalysis> {
    return {
      title: content.slice(0, 100),
      description: content.slice(0, 200),
      fullContent: content,
      contentType: 'other',
      topics: [],
      entities: {
        people: [],
        organizations: [],
        technologies: [],
        locations: [],
      },
      keyTakeaways: [],
      actionItems: [],
      dates: [],
      difficulty: 'intermediate',
    };
  }
}
