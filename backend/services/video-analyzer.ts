import { YoutubeTranscript } from 'youtube-transcript';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger.js';
import { generateStructuredResponse, analyzeFrames } from './ai.js';
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
export async function analyzeYouTubeVideo(url: string, userId: string): Promise<DeepAnalysis> {
  try {
    logger.info(`[VideoAnalyzer] Analyzing YouTube video: ${url}`);

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

    // Step 3: Extract key moments (unused for now but good for future)
    // const keyMoments = extractKeyMoments(transcriptData);

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
    logger.error(`[VideoAnalyzer] Error analyzing YouTube video ${url}:`, error);

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
 * Extract frames from a video file using ffmpeg
 */
async function extractFrames(videoPath: string, count: number = 8): Promise<string[]> {
  const tempDir = path.join(os.tmpdir(), `frames-${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  logger.info(`[VideoAnalyzer] Extracting ${count} frames from ${videoPath} to ${tempDir}`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: count,
        folder: tempDir,
        filename: 'frame-%i.jpg',
        size: '1280x720' // Resize to reasonable size for GPT-4V
      })
      .on('end', async () => {
        try {
          const files = await fs.promises.readdir(tempDir);
          const frames: string[] = [];

          for (const file of files) {
            if (file.endsWith('.jpg')) {
              const filePath = path.join(tempDir, file);
              const buffer = await fs.promises.readFile(filePath);
              frames.push(buffer.toString('base64'));
              // Clean up individual frame file
              await fs.promises.unlink(filePath);
            }
          }
          
          // Clean up temp dir
          await fs.promises.rmdir(tempDir);
          
          resolve(frames);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        logger.error('[VideoAnalyzer] ffmpeg error:', err);
        reject(err);
      });
  });
}

/**
 * Analyze a video file (uploaded) using Frame Extraction + GPT-4 Vision
 */
export async function analyzeVideoFile(videoPath: string, userId: string): Promise<DeepAnalysis> {
  try {
    logger.info(`[VideoAnalyzer] Analyzing video file: ${videoPath}`);

    // Step 1: Extract frames
    const frames = await extractFrames(videoPath, 8);
    logger.info(`[VideoAnalyzer] Extracted ${frames.length} frames`);

    // Step 2: Analyze frames with GPT-4 Vision
    const prompt = `Analyze this video by examining these frames. Provide:
1. Overall video summary and narrative
2. Key scenes and transitions
3. All visible text across frames (OCR)
4. Objects and people throughout
5. Actions and events happening
6. Suggested tags
7. Actionable items (dates, tasks, etc.)

Return ONLY valid JSON:
{
  "title": "Video title (infer from content)",
  "description": "Comprehensive summary",
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

    const analysisJson = await analyzeFrames(
      frames.map(f => ({ type: 'base64', data: f })),
      prompt,
      userId
    );

    // Parse JSON response (it might be wrapped in markdown code blocks)
    const cleanJson = analysisJson.replace(/```json\n|\n```/g, '');
    let analysis: any;
    try {
        analysis = JSON.parse(cleanJson);
    } catch (e) {
        // Retry parsing or fallback
        logger.warn('[VideoAnalyzer] Failed to parse JSON from vision analysis, trying loose parse');
        // Simple fallback
        analysis = {
            title: "Video Analysis",
            description: analysisJson.slice(0, 200),
            topics: [],
            entities: { people: [], organizations: [], technologies: [], locations: [] },
            keyTakeaways: [],
            actionItems: [],
            dates: [],
            difficulty: "intermediate"
        };
    }

    return {
      title: analysis.title || "Video Capture",
      description: analysis.description || "No description available",
      fullContent: analysis.description || "", // Video doesn't have text content like article
      contentType: 'video',
      topics: analysis.topics || [],
      entities: analysis.entities || { people: [], organizations: [], technologies: [], locations: [] },
      keyTakeaways: analysis.keyTakeaways || [],
      actionItems: analysis.actionItems || [],
      dates: analysis.dates || [],
      difficulty: analysis.difficulty || 'intermediate',
      estimatedReadTime: 5 // Default
    };

  } catch (error: any) {
    logger.error(`[VideoAnalyzer] Error analyzing video file:`, error);
     return {
      title: 'Video Capture',
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
 * Check if URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}