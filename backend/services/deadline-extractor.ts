import { generateStructuredResponse } from './ai.js';
import { logger } from '../utils/logger.js';

// ============================================
// Deadline Extraction Types
// ============================================

export interface ExtractedDeadline {
    hasDeadline: boolean;
    deadline: string | null; // ISO date string
    description: string | null;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-1
}

interface LLMDeadlineResponse {
    hasDeadline: boolean;
    deadline: string | null;
    description: string | null;
    urgency: string;
    confidence: number;
}

// ============================================
// Deadline Extraction Service
// ============================================

const DEADLINE_EXTRACTION_PROMPT = `You are a deadline extraction assistant. Analyze the provided content and extract any time-sensitive deadlines or due dates.

Look for:
- Application deadlines (job applications, scholarships, programs)
- Due dates (assignments, projects, payments)
- Event registration deadlines
- Expiration dates (offers, discounts, coupons)
- RSVP dates
- Any other time-sensitive action items

Return a JSON object with:
- hasDeadline: boolean - true if a deadline was found
- deadline: string | null - ISO date string (YYYY-MM-DDTHH:mm:ssZ) of the deadline, or null
- description: string | null - Brief description of what the deadline is for
- urgency: "low" | "medium" | "high" | "critical" based on how soon the deadline is
- confidence: number (0-1) - How confident you are in the extraction

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

Rules:
- If no clear deadline exists, set hasDeadline to false
- For relative dates like "next Friday", calculate the actual date
- For vague deadlines like "soon" or "ASAP", estimate a reasonable date
- Set urgency based on: critical (< 24h), high (< 3 days), medium (< 7 days), low (> 7 days)`;

/**
 * Extract deadline information from content using LLM
 * 
 * @param content - The text content to analyze
 * @param userId - User ID for LLM context
 * @returns Extracted deadline information
 * 
 * @example
 * ```ts
 * const deadline = await extractDeadline(
 *   'Google Summer Internship 2026 - Applications due January 25, 2026',
 *   'user-123'
 * );
 * // Returns: { hasDeadline: true, deadline: '2026-01-25T00:00:00Z', ... }
 * ```
 */
export async function extractDeadline(
    content: string,
    userId: string
): Promise<ExtractedDeadline> {
    logger.info(`[DeadlineExtractor] Analyzing content for deadlines...`);

    try {
        // Limit content length to avoid token issues
        const truncatedContent = content.slice(0, 4000);

        const result = await generateStructuredResponse<LLMDeadlineResponse>(
            truncatedContent,
            DEADLINE_EXTRACTION_PROMPT,
            userId,
            { temperature: 0.3 } // Lower temperature for more consistent extraction
        );

        // Validate and normalize the response
        const extracted: ExtractedDeadline = {
            hasDeadline: Boolean(result.hasDeadline),
            deadline: result.deadline ? normalizeDate(result.deadline) : null,
            description: result.description || null,
            urgency: validateUrgency(result.urgency),
            confidence: Math.min(1, Math.max(0, result.confidence || 0)),
        };

        if (extracted.hasDeadline) {
            logger.info(
                `[DeadlineExtractor] Found deadline: ${extracted.deadline} (${extracted.description})`
            );
        } else {
            logger.info(`[DeadlineExtractor] No deadline found in content`);
        }

        return extracted;
    } catch (error: any) {
        logger.error(`[DeadlineExtractor] Extraction failed:`, error);

        // Return safe default on error
        return {
            hasDeadline: false,
            deadline: null,
            description: null,
            urgency: 'low',
            confidence: 0,
        };
    }
}

/**
 * Normalize a date string to ISO format
 */
function normalizeDate(dateStr: string): string | null {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return null;
        }
        return date.toISOString();
    } catch {
        return null;
    }
}

/**
 * Validate and normalize urgency level
 */
function validateUrgency(urgency: string): ExtractedDeadline['urgency'] {
    const valid = ['low', 'medium', 'high', 'critical'];
    if (valid.includes(urgency?.toLowerCase())) {
        return urgency.toLowerCase() as ExtractedDeadline['urgency'];
    }
    return 'low';
}

/**
 * Calculate urgency based on deadline date
 */
export function calculateUrgency(deadline: Date): ExtractedDeadline['urgency'] {
    const now = new Date();
    const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 24) return 'critical';
    if (hoursUntil < 72) return 'high';
    if (hoursUntil < 168) return 'medium';
    return 'low';
}

/**
 * Check if a deadline is approaching (within specified hours)
 */
export function isDeadlineApproaching(deadline: string, withinHours: number = 24): boolean {
    try {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntil > 0 && hoursUntil <= withinHours;
    } catch {
        return false;
    }
}
