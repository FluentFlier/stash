import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

type ChatCompletionMessageParam = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content:
  | string
  | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
};

type ChatCompletionResponse = {
  choices: Array<{ message?: { content?: string } }>;
};

type EmbeddingResponse = {
  data: Array<{ embedding: number[] }>;
};

const getSupermemoryBaseUrl = () => {
  const baseUrl = config.ai.supermemoryBaseUrl;
  if (!baseUrl) {
    throw new Error(
      'Supermemory base URL is not configured. Set SUPERMEMORY_BASE_URL or OPENAI_BASE_URL.'
    );
  }
  return baseUrl.replace(/\/$/, '');
};

const getSupermemoryHeaders = (userId?: string) => {
  if (!config.ai.supermemoryApiKey) {
    throw new Error('Supermemory API key is not configured. Set SUPERMEMORY_API_KEY.');
  }
  if (!config.ai.openaiApiKey) {
    throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY.');
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    Authorization: `Bearer ${config.ai.openaiApiKey}`,
    'x-supermemory-api-key': config.ai.supermemoryApiKey,
  };

  if (userId) {
    headers['x-sm-user-id'] = userId;
  }

  return headers;
};

const supermemoryRequest = async <T>(
  path: string,
  body: Record<string, unknown>,
  userId?: string
): Promise<T> => {
  const url = `${getSupermemoryBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getSupermemoryHeaders(userId),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supermemory request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
};

// ============================================
// AI Helper Functions
// ============================================

/**
 * Generate chat completion with user context (via Supermemory)
 */
export async function generateChatCompletion(
  messages: ChatCompletionMessageParam[],
  userId: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' | 'text' };
  }
): Promise<string> {
  try {
    const response = await supermemoryRequest<ChatCompletionResponse>(
      '/chat/completions',
      {
        model: options?.model || config.ai.openaiModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        response_format: options?.responseFormat,
      },
      userId
    );

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
    const response = await supermemoryRequest<EmbeddingResponse>('/embeddings', {
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
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
    const response = await supermemoryRequest<ChatCompletionResponse>(
      '/chat/completions',
      {
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
      },
      userId
    );

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    logger.error('[AI] Image analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Analyze multiple frames with GPT-4 Vision (for video analysis)
 */
export async function analyzeFrames(
  frames: Array<{ type: 'base64' | 'url'; data: string }>,
  prompt: string,
  userId: string
): Promise<string> {
  try {
    const imageContent = frames.map((frame) => ({
      type: 'image_url' as const,
      image_url: {
        url: frame.type === 'base64'
          ? `data:image/jpeg;base64,${frame.data}`
          : frame.data,
      },
    }));

    const response = await supermemoryRequest<ChatCompletionResponse>(
      '/chat/completions',
      {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 2000,
      },
      userId
    );

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    logger.error('[AI] Frame analysis error:', error);
    throw new Error(`Failed to analyze frames: ${error.message}`);
  }
}

/**
 * Chat with memory - uses Supermemory to maintain context
 */
export async function chatWithMemory(
  message: string,
  userId: string,
  conversationHistory?: ChatCompletionMessageParam[]
): Promise<{ message: string; sources?: any[] }> {
  try {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are Stash AI, an intelligent assistant with access to the user's saved content.
        You can help them find, organize, and understand what they've saved.
        Be helpful, concise, and contextual. Use information from their saved content to provide relevant answers.`,
      },
      ...(conversationHistory || []),
      { role: 'user', content: message },
    ];

    const response = await supermemoryRequest<ChatCompletionResponse>(
      '/chat/completions',
      {
        model: config.ai.openaiModel,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      userId
    );

    return {
      message:
        response.choices[0]?.message?.content ||
        'I apologize, but I could not generate a response.',
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
