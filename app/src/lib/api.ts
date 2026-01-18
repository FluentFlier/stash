import { API_URL } from '../config/env';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type AuthResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    createdAt?: string;
  };
  token: string;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data as T;
}

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name?: string) {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
}

export async function createCapture(
  token: string,
  payload: {
    type: 'LINK' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'OTHER';
    content: string;
    userInput?: string;
    metadata?: Record<string, any>;
  }
) {
  return apiRequest<{ captureId: string; status: string }>(
    '/api/captures',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function sendChatMessage(token: string, message: string) {
  return apiRequest<{ message: string; metadata?: { sources?: any[] } }>(
    '/api/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    },
    token
  );
}

export async function uploadFile(
  token: string,
  fileUri: string,
  fileName: string,
  mimeType: string
) {
  const formData = new FormData();
  formData.append(
    'file',
    {
      uri: fileUri,
      name: fileName,
      type: mimeType || 'application/octet-stream',
    } as any
  );

  return apiRequest<{ url: string; fileName: string; mimeType: string }>(
    '/api/uploads',
    {
      method: 'POST',
      body: formData,
    },
    token
  );
}
