// ============================================
// API Request/Response Types
// ============================================

export interface CreateCaptureRequest {
  type: 'LINK' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'OTHER';
  content: string;
  userInput?: string;
  metadata?: Record<string, any>;
}

export interface CreateCaptureResponse {
  success: boolean;
  captureId: string;
  status: 'processing' | 'pending';
}

export interface ChatRequest {
  message: string;
  captureId?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  metadata?: {
    relatedCaptures?: string[];
    sources?: string[];
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  action?: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal';
}
