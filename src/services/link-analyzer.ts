import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { generateStructuredResponse } from './ai.js';
import { DeepAnalysis } from '../types/agents.js';

/**
 * Analyze link using Jina AI Reader for content extraction
 * and GPT-4 for deep analysis
 */
export async function analyzeLink(url: string, userId: string): Promise<DeepAnalysis> {
  try {
    logger.info(`[LinkAnalyzer] Fetching content for ${url}`);

    // Step 1: Fetch full content using Jina AI Reader
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Authorization': `Bearer ${config.ai.jinaApiKey}`,
        'X-Return-Format': 'text',
      },
    });

    if (!response.ok) {
      throw new Error(`Jina AI failed with status ${response.status}`);
    }

    const fullContent = await response.text();

    if (!fullContent || fullContent.length < 50) {
      throw new Error('Content too short or empty');
    }

    logger.info(`[LinkAnalyzer] Fetched ${fullContent.length} characters`);

    // Step 2: Deep analysis with GPT-4
    logger.info(`[LinkAnalyzer] Running deep analysis with GPT-4`);

    const analysisPrompt = `Analyze this content and return ONLY valid JSON:\n\n${fullContent.slice(0, 8000)}`;

    const systemPrompt = `You are a content analyst. Analyze the content and return ONLY valid JSON with this structure:
{
  "contentType": "article" | "video" | "pdf" | "documentation" | "social" | "other",
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
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedReadTime": number
}`;

    const analysis = await generateStructuredResponse<{
      contentType: DeepAnalysis['contentType'];
      topics: string[];
      entities: DeepAnalysis['entities'];
      keyTakeaways: string[];
      actionItems: string[];
      dates: string[];
      difficulty: DeepAnalysis['difficulty'];
      estimatedReadTime: number;
    }>(analysisPrompt, systemPrompt, userId);

    // Step 3: Extract title and description
    const titleMatch = fullContent.match(/^# (.+)$/m) || fullContent.match(/^(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : url;

    const descLines = fullContent.split('\n').filter((line) => line.trim().length > 50);
    const description = descLines[0]?.slice(0, 200) || fullContent.slice(0, 200);

    logger.info(`[LinkAnalyzer] Analysis complete for ${url}`);

    return {
      url,
      title,
      description,
      fullContent,
      contentType: analysis.contentType,
      topics: analysis.topics,
      entities: analysis.entities,
      keyTakeaways: analysis.keyTakeaways,
      actionItems: analysis.actionItems,
      dates: analysis.dates,
      estimatedReadTime: analysis.estimatedReadTime,
      difficulty: analysis.difficulty,
    };
  } catch (error: any) {
    logger.error(`[LinkAnalyzer] Error analyzing ${url}:`, error);

    // Return fallback analysis
    return {
      url,
      title: url,
      description: 'Failed to analyze content',
      fullContent: '',
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

/**
 * Check if URL is valid and accessible
 */
export async function validateUrl(url: string): Promise<boolean> {
  try {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return false;
    }

    // Try to fetch headers only
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch (error) {
    logger.warn(`[LinkAnalyzer] URL validation failed for ${url}:`, error);
    return false;
  }
}
