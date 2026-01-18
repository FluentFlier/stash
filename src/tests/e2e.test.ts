import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentCoordinator } from '../agents/coordinator.js';
import { CaptureType, ProcessingStatus } from '@prisma/client';

// Mock dependencies
vi.mock('../config/env.js', () => ({
  config: {
    ai: {
      openaiApiKey: 'mock-key',
      jinaApiKey: 'mock-key',
    },
    redis: {
      url: 'redis://localhost:6379',
    },
    agent: {
        maxReasoningSteps: 5,
        confidenceThreshold: 0.7,
    }
  },
}));

vi.mock('../config/database.js', () => ({
  prisma: {
    capture: {
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    userPattern: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    actionOutcome: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    collection: {
      findFirst: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'col-1', name: 'Test' }),
    },
    tag: {
      findFirst: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'tag-1', name: 'Test' }),
    },
    collectionCapture: {
      create: vi.fn(),
    },
    captureTag: {
      create: vi.fn(),
      upsert: vi.fn(),
    }
  },
}));

vi.mock('../services/video-analyzer.js', () => ({
  analyzeVideoFile: vi.fn().mockResolvedValue({
    title: 'Test Video',
    description: 'A test video description',
    contentType: 'video',
    topics: ['testing', 'ai'],
    entities: { people: [], organizations: [], technologies: [], locations: [] },
    keyTakeaways: ['Video works'],
    actionItems: [],
    dates: [],
    difficulty: 'beginner',
  }),
  isYouTubeUrl: vi.fn().mockReturnValue(false),
}));

vi.mock('../services/ai.js', () => ({
  generateChatCompletion: vi.fn().mockResolvedValue('Mocked context summary'),
  generateStructuredResponse: vi.fn().mockImplementation((prompt, system) => {
    // Return appropriate mock based on what agent is calling
    if (system.includes('intent')) {
      return Promise.resolve({
        primary_intent: 'learn',
        urgency: 'low',
        category: 'education',
        suggested_actions: ['SUMMARIZE'],
      });
    }
    // Force planner failure to test fallback or just match fallback
    return Promise.reject(new Error('Mock AI failure for planning'));
  }),
  analyzeImage: vi.fn(),
}));

vi.mock('../services/notifications.js', () => ({
  sendNotification: vi.fn().mockResolvedValue({ success: true }),
}));

describe('End-to-End Agent Workflow', () => {
  let coordinator: AgentCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    coordinator = new AgentCoordinator();
  });

  it('should process a VIDEO capture completely', async () => {
    const mockCapture = {
      id: 'capture-123',
      userId: 'user-456',
      type: 'VIDEO',
      content: 'http://example.com/video.mp4',
      userInput: 'Analyze this video',
      processingStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Run the coordinator
    const result = await coordinator.processCapture(mockCapture as any, 'user-456');

    // Assertions
    expect(result.success).toBe(true);
    expect(result.analysis.contentAnalysis.title).toBe('Test Video');
    // Expect fallback action
    expect(['ADD_TAG', 'ADD_TO_COLLECTION', 'NOTIFY']).toContain(result.plan.actions[0].type);

    // Verify database update
    const { prisma } = await import('../config/database.js');
    expect(prisma.capture.update).toHaveBeenCalledWith({
      where: { id: 'capture-123' },
      data: expect.objectContaining({
        processingStatus: 'COMPLETED',
        analysis: expect.anything(),
        actionPlan: expect.anything(),
        actionResults: expect.anything(),
      }),
    });
  });
});
