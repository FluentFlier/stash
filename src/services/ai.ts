import OpenAI from 'openai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ============================================
// OpenAI Client (with optional Supermemory routing)
// ============================================

export const openai = new OpenAI({
  apiKey: config.ai.openaiApiKey,
  baseURL: config.ai.openaiBaseUrl || config.ai.supermemoryBaseUrl,
  // Use Supermemory headers if configured
  ...(config.ai.supermemoryApiKey && {
    defaultHeaders: {
      'x-sm-api-key': config.ai.supermemoryApiKey,
    },
  }),
});

// ============================================
// AI Helper Functions
// ============================================

/**
 * Generate chat completion with user context (via Supermemory if configured)
 */
export async function generateChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  userId: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' | 'text' };
  }
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: options?.model || 'gpt-4-turbo-preview',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      response_format: options?.responseFormat,
      // Supermemory user ID header for context
      ...(config.ai.supermemoryApiKey && {
        headers: {
          'x-sm-user-id': userId,
        },
      }),
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    logger.error('[AI] Chat completion error:', error);
    throw new Error(`AI completion failed: ${error.message}`);
  }
}

/**
 * Generate structured JSON response
 */
export async function generateStructuredResponse<T = any>(
  prompt: string,
  systemPrompt: string,
  userId: string,
  options?: {
    model?: string;
    temperature?: number;
  }
): Promise<T> {
  try {
    const content = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      userId,
      {
        ...options,
        responseFormat: { type: 'json_object' },
      }
    );

    return JSON.parse(content) as T;
  } catch (error: any) {
    logger.error('[AI] Structured response error:', error);
    throw new Error(`Failed to generate structured response: ${error.message}`);
  }
}

/**
 * Generate embeddings for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit input size
    });

    return response.data[0].embedding;
  } catch (error: any) {
    logger.error('[AI] Embedding generation error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Analyze content with GPT-4 Vision (for images)
 */
export async function analyzeImage(
  imageUrl: string,
  prompt: string,
  userId: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1000,
      ...(config.ai.supermemoryApiKey && {
        headers: {
          'x-sm-user-id': userId,
        },
      }),
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    logger.error('[AI] Image analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Analyze multiple frames (images) with GPT-4 Vision
 */
export async function analyzeFrames(
  frames: Array<{ type: 'base64' | 'url'; data: string }>,
  prompt: string,
  userId: string
): Promise<string> {
  try {
    const content: any[] = [{ type: 'text', text: prompt }];

    frames.forEach((frame) => {
      if (frame.type === 'base64') {
        content.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${frame.data}` },
        });
      } else {
        content.push({
          type: 'image_url',
          image_url: { url: frame.data },
        });
      }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: content,
        },
      ],
      max_tokens: 2000,
      ...(config.ai.supermemoryApiKey && {
        headers: {
          'x-sm-user-id': userId,
        },
      }),
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    logger.error('[AI] Frames analysis error:', error);
    throw new Error(`Failed to analyze frames: ${error.message}`);
  }
}

/**
 * Chat with memory - uses Supermemory to maintain context
 */
export async function chatWithMemory(
  message: string,
  userId: string,
  conversationHistory?: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<{ message: string; sources?: any[] }> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are Stash AI, an intelligent assistant with access to the user's saved content.
        You can help them find, organize, and understand what they've saved.
        Be helpful, concise, and contextual. Use information from their saved content to provide relevant answers.`,
      },
      ...(conversationHistory || []),
      { role: 'user', content: message },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      ...(config.ai.supermemoryApiKey && {
        headers: {
          'x-sm-user-id': userId,
        },
      }),
    });

    return {
      message: response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.',
      // TODO: Extract sources from Supermemory response metadata
      sources: [],
    };
  } catch (error: any) {
    logger.error('[AI] Chat with memory error:', error);
    throw new Error(`Chat failed: ${error.message}`);
  }
}

/**
 * Summarize content
 */
export async function summarizeContent(
  content: string,
  userId: string,
  maxLength: number = 200
): Promise<string> {
  try {
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `Summarize the following content in ${maxLength} words or less. Be concise and capture the key points.`,
        },
        { role: 'user', content },
      ],
      userId,
      {
        model: 'gpt-4-turbo-preview',
        temperature: 0.5,
      }
    );

    return response;
  } catch (error: any) {
    logger.error('[AI] Summarization error:', error);
    return content.slice(0, maxLength) + '...';
  }
}
