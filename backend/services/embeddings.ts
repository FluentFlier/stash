import { generateEmbedding } from './ai.js';
import { logger } from '../utils/logger.js';

/**
 * Generate embedding for content
 */
export async function createEmbedding(text: string): Promise<number[] | null> {
  try {
    const embedding = await generateEmbedding(text);
    return embedding;
  } catch (error) {
    logger.error('[Embeddings] Error generating embedding:', error);
    return null;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find similar captures using embeddings
 * Note: This uses basic similarity calculation.
 * For production, use pgvector extension with proper indexing.
 */
export async function findSimilarCaptures(
  _embedding: number[],
  _userId: string,
  _limit: number = 5
): Promise<any[]> {
  // This is a placeholder - in production, you would use pgvector
  // For now, we'll use topic-based similarity in the AnalyzerAgent
  logger.warn('[Embeddings] Semantic search not yet fully implemented');
  return [];
}
