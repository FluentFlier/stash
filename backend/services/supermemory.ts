import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ============================================
// Supermemory API Types
// ============================================

export interface MemoryMetadata {
    title?: string;
    captureType?: string;
    deadline?: string; // ISO date string
    deadlineDescription?: string;
    topics?: string[];
    entities?: string[];
    url?: string;
    [key: string]: unknown;
}

export interface AddMemoryParams {
    content: string;
    userId: string;
    captureId: string;
    metadata?: MemoryMetadata;
}

export interface SearchMemoryParams {
    query: string;
    userId: string;
    limit?: number;
    filters?: Record<string, unknown>;
}

export interface MemoryDocument {
    id: string;
    content: string;
    metadata?: MemoryMetadata;
    score?: number;
    createdAt?: string;
}

interface AddDocumentResponse {
    id: string;
    status: string;
}

interface SearchResponse {
    results: Array<{
        id: string;
        content: string;
        metadata?: MemoryMetadata;
        score: number;
    }>;
}

// ============================================
// Supermemory Service
// ============================================

// Use direct Supermemory API, not the proxy pattern
const SUPERMEMORY_API_URL = 'https://api.supermemory.ai/v3';

/**
 * Get headers for Supermemory API requests
 */
function getHeaders(): Record<string, string> {
    const apiKey = config.ai.supermemoryApiKey;

    if (!apiKey) {
        throw new Error('SUPERMEMORY_API_KEY is not configured');
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };
}

/**
 * Make a request to the Supermemory API
 */
async function supermemoryRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
): Promise<T> {
    const url = `${SUPERMEMORY_API_URL}${path}`;

    const options: RequestInit = {
        method,
        headers: getHeaders(),
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supermemory API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
}

// ============================================
// Public API
// ============================================

/**
 * Add a memory document to Supermemory
 * 
 * @param params - Memory content, user ID, capture ID, and optional metadata
 * @returns The document ID and status
 * 
 * @example
 * ```ts
 * const result = await addMemory({
 *   content: 'Job posting at Google - Apply by Jan 25, 2026',
 *   userId: 'user-123',
 *   captureId: 'capture-456',
 *   metadata: {
 *     title: 'Google SWE Internship',
 *     captureType: 'link',
 *     deadline: '2026-01-25T00:00:00Z',
 *     deadlineDescription: 'Application deadline'
 *   }
 * });
 * ```
 */
export async function addMemory(params: AddMemoryParams): Promise<AddDocumentResponse> {
    const { content, userId, captureId, metadata } = params;

    logger.info(`[Supermemory] Adding memory for user ${userId}, capture ${captureId}`);

    try {
        const response = await supermemoryRequest<AddDocumentResponse>('POST', '/documents', {
            content,
            containerTags: [userId], // User isolation (array per API docs)
            customId: captureId,  // Link to our capture
            metadata: {
                ...metadata,
                stashCaptureId: captureId,
                addedAt: new Date().toISOString(),
            },
        });

        logger.info(`[Supermemory] Memory added: ${response.id} (status: ${response.status})`);
        return response;
    } catch (error: any) {
        logger.error(`[Supermemory] Failed to add memory:`, error);
        throw error;
    }
}

/**
 * Search memories for a user
 * 
 * @param params - Search query, user ID, and optional limit/filters
 * @returns Array of matching memory documents
 * 
 * @example
 * ```ts
 * const results = await searchMemories({
 *   query: 'job applications with deadlines',
 *   userId: 'user-123',
 *   limit: 10
 * });
 * ```
 */
export async function searchMemories(params: SearchMemoryParams): Promise<MemoryDocument[]> {
    const { query, userId, limit = 10, filters } = params;

    logger.info(`[Supermemory] Searching memories for user ${userId}: "${query.slice(0, 50)}..."`);

    try {
        const response = await supermemoryRequest<SearchResponse>('POST', '/search', {
            q: query,  // Supermemory uses 'q' not 'query'
            containerTags: [userId],  // Array format per API docs
            limit,
            ...filters,
        });

        logger.info(`[Supermemory] Found ${response.results.length} memories`);

        return response.results.map((r) => ({
            id: r.id,
            content: r.content,
            metadata: r.metadata,
            score: r.score,
        }));
    } catch (error: any) {
        logger.error(`[Supermemory] Search failed:`, error);
        throw error;
    }
}

/**
 * Delete a memory document
 * 
 * @param documentId - The Supermemory document ID
 */
export async function deleteMemory(documentId: string): Promise<void> {
    logger.info(`[Supermemory] Deleting memory: ${documentId}`);

    try {
        await supermemoryRequest<{ success: boolean }>('DELETE', `/documents/${documentId}`);
        logger.info(`[Supermemory] Memory deleted: ${documentId}`);
    } catch (error: any) {
        logger.error(`[Supermemory] Failed to delete memory:`, error);
        throw error;
    }
}

/**
 * Get memories with upcoming deadlines for a user
 * 
 * @param userId - The user ID
 * @param withinDays - Number of days to look ahead (default: 7)
 * @returns Array of memories with deadlines in the specified window
 */
export async function getUpcomingDeadlines(
    userId: string,
    withinDays: number = 7
): Promise<MemoryDocument[]> {
    logger.info(`[Supermemory] Getting deadlines within ${withinDays} days for user ${userId}`);

    try {
        // Search for memories that mention deadlines
        const results = await searchMemories({
            query: 'deadline due date apply by expires',
            userId,
            limit: 50,
        });

        // Filter to only those with deadline metadata within the window
        const now = new Date();
        const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

        const upcomingDeadlines = results.filter((memory) => {
            if (!memory.metadata?.deadline) return false;

            const deadline = new Date(memory.metadata.deadline);
            return deadline >= now && deadline <= cutoff;
        });

        logger.info(`[Supermemory] Found ${upcomingDeadlines.length} upcoming deadlines`);
        return upcomingDeadlines;
    } catch (error: any) {
        logger.error(`[Supermemory] Failed to get upcoming deadlines:`, error);
        return [];
    }
}

/**
 * Check if Supermemory is configured and available
 */
export function isSupermemoryConfigured(): boolean {
    return !!config.ai.supermemoryApiKey;
}
