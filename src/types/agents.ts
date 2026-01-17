import { Capture } from '@prisma/client';

// ============================================
// Analysis Types
// ============================================

export interface DeepAnalysis {
  url?: string;
  title: string;
  description: string;
  fullContent: string;
  contentType: 'article' | 'video' | 'pdf' | 'documentation' | 'social' | 'other';
  topics: string[];
  entities: {
    people: string[];
    organizations: string[];
    technologies: string[];
    locations: string[];
  };
  keyTakeaways: string[];
  actionItems: string[];
  dates: string[];
  estimatedReadTime?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AnalyzerOutput {
  reasoning: ReasoningStep[];
  contentAnalysis: DeepAnalysis;
  context: string;
  intent: UserIntent;
  relatedContent: Capture[];
  relatedCount: number;
}

export interface ReasoningStep {
  step: string;
  observation: string;
  result: any;
}

export interface UserIntent {
  primary_intent: 'save_for_later' | 'learn' | 'research' | 'reference' | 'share' | 'action_required';
  urgency: 'low' | 'medium' | 'high';
  category: string;
  suggested_actions: string[];
}

// ============================================
// Planning Types
// ============================================

export interface ActionPlan {
  captureId: string;
  userId: string;
  actions: Action[];
  reasoning: string;
  confidence: number;
}

export interface Action {
  type: ActionType;
  data: any;
  priority: number;
  reasoning: string;
}

export type ActionType =
  | 'ADD_TO_COLLECTION'
  | 'CREATE_REMINDER'
  | 'ADD_TAG'
  | 'CREATE_CALENDAR_EVENT'
  | 'NOTIFY'
  | 'SUMMARIZE'
  | 'EXTRACT_ENTITIES';

// ============================================
// Execution Types
// ============================================

export interface ExecutionResult {
  action: ActionType;
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================
// Learning Types
// ============================================

export interface UserPattern {
  patternType: string;
  data: any;
  confidence: number;
  lastUpdated: Date;
}

export interface PatternData {
  [key: string]: any;
}
