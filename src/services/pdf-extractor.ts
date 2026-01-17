import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger.js';
import { generateStructuredResponse } from './ai.js';
import { DeepAnalysis } from '../types/agents.js';

/**
 * Extract text from PDF and analyze with GPT-4
 */
export async function analyzePdf(pdfUrl: string, userId: string): Promise<DeepAnalysis> {
  try {
    logger.info(`[PDFExtractor] Analyzing PDF: ${pdfUrl}`);

    // Step 1: Fetch PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 2: Extract text using pdf-parse
    logger.info(`[PDFExtractor] Extracting text from PDF`);
    const data = await pdfParse(buffer);

    const fullContent = data.text;

    if (!fullContent || fullContent.length < 50) {
      throw new Error('PDF content too short or empty');
    }

    logger.info(`[PDFExtractor] Extracted ${fullContent.length} characters from ${data.numpages} pages`);

    // Step 3: Analyze with GPT-4
    const analysisPrompt = `Analyze this PDF content:\n\n${fullContent.slice(0, 8000)}`;

    const systemPrompt = `You are a document analyst. Analyze the PDF and return ONLY valid JSON:
{
  "title": "Document title (infer from content)",
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

    logger.info(`[PDFExtractor] Analysis complete for PDF`);

    return {
      url: pdfUrl,
      title: analysis.title || data.info?.Title || 'PDF Document',
      description: analysis.keyTakeaways[0] || 'PDF document',
      fullContent,
      contentType: 'pdf',
      topics: analysis.topics,
      entities: analysis.entities,
      keyTakeaways: analysis.keyTakeaways,
      actionItems: analysis.actionItems,
      dates: analysis.dates,
      estimatedReadTime: analysis.estimatedReadTime,
      difficulty: analysis.difficulty,
    };
  } catch (error: any) {
    logger.error(`[PDFExtractor] Error analyzing PDF ${pdfUrl}:`, error);

    return {
      url: pdfUrl,
      title: 'PDF Document',
      description: 'PDF analysis unavailable',
      fullContent: '',
      contentType: 'pdf',
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
 * Check if URL points to a PDF file
 */
export function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('/pdf/');
}
