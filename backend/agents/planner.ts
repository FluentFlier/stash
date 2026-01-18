import { logger } from '../utils/logger.js';
import { generateStructuredResponse } from '../services/ai.js';
import { AnalyzerOutput } from '../types/agents.js';
import { ActionPlan, Action } from '../types/agents.js';

/**
 * Planner Agent
 * Creates action plans based on content analysis
 */
export class PlannerAgent {
  /**
   * Create an action plan based on analysis
   */
  async createPlan(analysis: AnalyzerOutput, userId: string): Promise<ActionPlan> {
    try {
      logger.info('[PlannerAgent] Creating action plan');

      // Build context for GPT-4
      const contextPrompt = this.buildContextPrompt(analysis);

      const systemPrompt = `You are an AI planning agent. Based on the analysis, create a plan of actions to take.
Available actions:
- ADD_TO_COLLECTION: Add to a themed collection
- CREATE_REMINDER: Set a reminder for later
- ADD_TAG: Add descriptive tags
- CREATE_CALENDAR_EVENT: Create calendar event if dates detected
- NOTIFY: Send push notification to user
- SUMMARIZE: Create a summary
- EXTRACT_ENTITIES: Extract and save entities

Return ONLY valid JSON:
{
  "actions": [
    {
      "type": "ADD_TO_COLLECTION" | "CREATE_REMINDER" | "ADD_TAG" | "CREATE_CALENDAR_EVENT" | "NOTIFY" | "SUMMARIZE" | "EXTRACT_ENTITIES",
      "data": {...},
      "priority": number (1-10),
      "reasoning": "Why this action?"
    }
  ],
  "reasoning": "Overall plan reasoning",
  "confidence": number (0-1)
}`;

      const plan = await generateStructuredResponse<{
        actions: Action[];
        reasoning: string;
        confidence: number;
      }>(contextPrompt, systemPrompt, userId, {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
      });

      logger.info(`[PlannerAgent] Created plan with ${plan.actions.length} actions`);

      return {
        captureId: '', // Will be set by coordinator
        userId,
        actions: plan.actions,
        reasoning: plan.reasoning,
        confidence: plan.confidence,
      };
    } catch (error: any) {
      logger.error('[PlannerAgent] Error creating plan:', error);

      // Return fallback plan
      return this.createFallbackPlan(analysis, userId);
    }
  }

  /**
   * Build context prompt from analysis
   */
  private buildContextPrompt(analysis: AnalyzerOutput): string {
    const { contentAnalysis, intent, relatedContent, context } = analysis;

    return `
CONTENT ANALYSIS:
- Type: ${contentAnalysis.contentType}
- Title: ${contentAnalysis.title}
- Topics: ${contentAnalysis.topics.join(', ')}
- Key Takeaways: ${contentAnalysis.keyTakeaways.join('; ')}
- Action Items: ${contentAnalysis.actionItems.join('; ')}
- Detected Dates: ${contentAnalysis.dates.join(', ')}
- Difficulty: ${contentAnalysis.difficulty}

USER INTENT:
- Primary Intent: ${intent.primary_intent}
- Urgency: ${intent.urgency}
- Category: ${intent.category}
- Suggested Actions: ${intent.suggested_actions.join(', ')}

CONTEXT:
${context}

RELATED CONTENT:
${relatedContent.length} related items found

Create an action plan that helps the user organize, remember, and act on this content.
`;
  }

  /**
   * Create a fallback plan when GPT-4 fails
   */
  private createFallbackPlan(analysis: AnalyzerOutput, userId: string): ActionPlan {
    const actions: Action[] = [];

    // Always add tags based on topics
    if (analysis.contentAnalysis.topics.length > 0) {
      actions.push({
        type: 'ADD_TAG',
        data: {
          tags: analysis.contentAnalysis.topics.slice(0, 3),
        },
        priority: 5,
        reasoning: 'Organize with topic-based tags',
      });
    }

    // Add to collection based on intent category
    if (analysis.intent.category) {
      actions.push({
        type: 'ADD_TO_COLLECTION',
        data: {
          collection: analysis.intent.category,
        },
        priority: 7,
        reasoning: `Related to ${analysis.intent.category}`,
      });
    }

    // Create reminder for high urgency items
    if (analysis.intent.urgency === 'high') {
      actions.push({
        type: 'CREATE_REMINDER',
        data: {
          message: `Review: ${analysis.contentAnalysis.title}`,
          scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
        },
        priority: 9,
        reasoning: 'High urgency item needs immediate attention',
      });
    }

    // Notify user about the save
    actions.push({
      type: 'NOTIFY',
      data: {
        title: '✅ Saved',
        body: `${analysis.contentAnalysis.title}${analysis.relatedCount > 0 ? ` (${analysis.relatedCount} related items)` : ''}`,
      },
      priority: 3,
      reasoning: 'Confirm successful save',
    });

    return {
      captureId: '',
      userId,
      actions,
      reasoning: 'Fallback plan using heuristics',
      confidence: 0.6,
    };
  }
}
