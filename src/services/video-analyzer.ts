import { YoutubeTranscript } from 'youtube-transcript';
import { logger } from '../utils/logger.js';
import { generateStructuredResponse } from './ai.js';
import { DeepAnalysis } from '../types/agents.js';

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Analyze YouTube video using transcript extraction and GPT-4 analysis
 */
export async function analyzeVideo(url: string, userId: string): Promise<DeepAnalysis> {
  try {
    logger.info(`[VideoAnalyzer] Analyzing video: ${url}`);

    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Step 1: Fetch transcript
    logger.info(`[VideoAnalyzer] Fetching transcript for video ${videoId}`);
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptData || transcriptData.length === 0) {
      throw new Error('No transcript available');
    }

    // Combine transcript text
    const fullContent = transcriptData.map((item) => item.text).join(' ');

    logger.info(`[VideoAnalyzer] Fetched transcript: ${fullContent.length} characters`);

    // Step 2: Analyze with GPT-4
    const analysisPrompt = `Analyze this YouTube video transcript:\n\n${fullContent.slice(0, 8000)}`;

    const systemPrompt = `You are a video content analyst. Analyze the transcript and return ONLY valid JSON:
{
  "title": "Video title (infer from content)",
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
      title: string;
      topics: string[];
      entities: DeepAnalysis['entities'];
      keyTakeaways: string[];
      actionItems: string[];
      dates: string[];
      difficulty: DeepAnalysis['difficulty'];
      estimatedReadTime: number;
    }>(analysisPrompt, systemPrompt, userId);

    // Step 3: Extract key moments with timestamps
    extractKeyMoments(transcriptData); // TODO: Use key moments in analysis

    logger.info(`[VideoAnalyzer] Analysis complete for video ${videoId}`);

    return {
      url,
      title: analysis.title,
      description: analysis.keyTakeaways[0] || 'Video content',
      fullContent,
      contentType: 'video',
      topics: analysis.topics,
      entities: analysis.entities,
      keyTakeaways: analysis.keyTakeaways,
      actionItems: analysis.actionItems,
      dates: analysis.dates,
      estimatedReadTime: analysis.estimatedReadTime,
      difficulty: analysis.difficulty,
    };
  } catch (error: any) {
    logger.error(`[VideoAnalyzer] Error analyzing video ${url}:`, error);

    // Return fallback
    return {
      url,
      title: 'YouTube Video',
      description: 'Video analysis unavailable',
      fullContent: '',
      contentType: 'video',
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
 * Extract key moments from transcript (timestamps with important content)
 */
function extractKeyMoments(transcript: any[]): Array<{ time: number; text: string }> {
  // Simple heuristic: extract every 10th segment or important keywords
  const keyMoments: Array<{ time: number; text: string }> = [];
  const importantKeywords = [
    'important',
    'key',
    'remember',
    'conclusion',
    'summary',
    'main',
    'first',
    'second',
    'finally',
  ];

  transcript.forEach((item, index) => {
    const text = item.text.toLowerCase();
    const hasKeyword = importantKeywords.some((keyword) => text.includes(keyword));

    if (hasKeyword || index % 10 === 0) {
      keyMoments.push({
        time: item.offset / 1000, // Convert ms to seconds
        text: item.text,
      });
    }
  });

  return keyMoments.slice(0, 10); // Return max 10 key moments
}

/**
 * Check if URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}
