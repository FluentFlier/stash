import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL
const API_URL = 'https://stash-backend-402905422218.us-central1.run.app';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    pagination?: {
        limit: number;
        offset: number;
        total: number;
    };
}

// Auth token management
export const authStorage = {
    async getToken(): Promise<string | null> {
        return await AsyncStorage.getItem('auth_token');
    },

    async setToken(token: string): Promise<void> {
        await AsyncStorage.setItem('auth_token', token);
    },

    async removeToken(): Promise<void> {
        await AsyncStorage.removeItem('auth_token');
    },

    async getUser(): Promise<any> {
        const userStr = await AsyncStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    async setUser(user: any): Promise<void> {
        await AsyncStorage.setItem('user', JSON.stringify(user));
    },

    async removeUser(): Promise<void> {
        await AsyncStorage.removeItem('user');
    }
};

// Capture types
export interface Capture {
    id: string;
    type: string;
    content: string;
    title?: string;
    description?: string;
    userInput?: string;
    metadata: any;
    analysis: any;
    processingStatus: string;
    createdAt: string;
    updatedAt: string;
    tags?: { tag: { id: string; name: string } }[];
}

// Chat message types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'USER' | 'ASSISTANT';
    content: string;
    createdAt?: string;
    metadata?: any;
}

// API client
class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const token = await authStorage.getToken();

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            };

            console.log(`[API] ${options.method || 'GET'} ${API_URL}${endpoint}`);

            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            let data: any;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Non-JSON response (HTML error page, etc.)
                const text = await response.text();
                console.warn('[API] Non-JSON response:', text.slice(0, 200));
                return {
                    success: false,
                    error: 'Server returned non-JSON response',
                };
            }

            if (!response.ok) {
                console.error('[API] Error response:', data);
                return {
                    success: false,
                    error: data.error || 'An error occurred',
                };
            }

            return data;
        } catch (error) {
            console.error('[API] Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // ============ AUTH ENDPOINTS ============
    async register(email: string, password: string, name?: string) {
        const response = await this.request<{ user: any; session: any }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });

        if (response.success && response.data?.session) {
            await authStorage.setToken(response.data.session.access_token);
            await authStorage.setUser(response.data.user);
        }

        return response;
    }

    async login(email: string, password: string) {
        const response = await this.request<{ user: any; session: any }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.data?.session) {
            await authStorage.setToken(response.data.session.access_token);
            await authStorage.setUser(response.data.user);
        }

        return response;
    }

    async logout() {
        const response = await this.request('/api/auth/logout', {
            method: 'POST',
        });

        await authStorage.removeToken();
        await authStorage.removeUser();

        return response;
    }

    async getMe() {
        return await this.request<any>('/api/auth/me', {
            method: 'GET',
        });
    }

    async updateOnboarding(data: {
        name?: string;
        role?: string;
        age?: number;
        notificationsEnabled?: boolean;
        googleCalendarConnected?: boolean;
    }) {
        const response = await this.request<any>('/api/auth/onboarding', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (response.success && response.data) {
            const currentUser = await authStorage.getUser();
            await authStorage.setUser({ ...currentUser, ...response.data });
        }

        return response;
    }

    // ============ CAPTURES ENDPOINTS ============
    async getCaptures(limit = 50, offset = 0, type?: string) {
        let url = `/api/captures?limit=${limit}&offset=${offset}`;
        if (type) url += `&type=${type}`;
        return await this.request<Capture[]>(url, {
            method: 'GET',
        });
    }

    async getCapture(id: string) {
        return await this.request<Capture>(`/api/captures/${id}`, {
            method: 'GET',
        });
    }

    async createCapture(data: {
        type: string;
        content: string;
        userInput?: string;
        title?: string;
    }) {
        return await this.request<Capture>('/api/captures', {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                type: data.type.toUpperCase(),
            }),
        });
    }

    async deleteCapture(id: string) {
        return await this.request<void>(`/api/captures/${id}`, {
            method: 'DELETE',
        });
    }

    async searchCaptures(query: string, limit = 20) {
        return await this.request<Capture[]>(`/api/captures/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
            method: 'GET',
        });
    }

    // ============ CHAT ENDPOINTS ============
    async sendChatMessage(message: string, captureId?: string) {
        return await this.request<{ message: string; sources: any[] }>('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message, captureId }),
        });
    }

    async getChatHistory(limit = 50, offset = 0) {
        return await this.request<ChatMessage[]>(`/api/chat/history?limit=${limit}&offset=${offset}`, {
            method: 'GET',
        });
    }

    async clearChatHistory() {
        return await this.request<void>('/api/chat/history', {
            method: 'DELETE',
        });
    }

    // ============ COLLECTIONS ENDPOINTS ============
    async getCollections() {
        return await this.request<any[]>('/api/collections', {
            method: 'GET',
        });
    }

    async createCollection(name: string, description?: string) {
        return await this.request<any>('/api/collections', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        });
    }

    async addToCollection(collectionId: string, captureId: string) {
        return await this.request<any>(`/api/collections/${collectionId}/captures`, {
            method: 'POST',
            body: JSON.stringify({ captureId }),
        });
    }

    // ============ REMINDERS ENDPOINTS ============
    async getReminders() {
        return await this.request<any[]>('/api/reminders', {
            method: 'GET',
        });
    }

    async createReminder(message: string, scheduledAt: string, captureId?: string) {
        return await this.request<any>('/api/reminders', {
            method: 'POST',
            body: JSON.stringify({ message, scheduledAt, captureId }),
        });
    }

    async completeReminder(id: string) {
        return await this.request<any>(`/api/reminders/${id}/complete`, {
            method: 'POST',
        });
    }

    // ============ NOTIFICATIONS ENDPOINTS ============
    async getNotifications() {
        // The backend returns { success: true, data: insights, meta: { unreadCount } }
        // The UI expects response.data.data to be the insights array.
        // So we wrap the result to match the UI expectation if needed, or 
        // better, we make sure types align.
        // Actually, many screens expect response.data.data, which means they 
        // treat ApiResponse.data as the full body or something similar.
        // Let's just adjust the call to match what the UI wants.
        return await this.request<any>('/api/notifications', {
            method: 'GET',
        });
    }

    async markNotificationRead(id: string) {
        return await this.request<any>(`/api/notifications/${id}/read`, {
            method: 'POST',
        });
    }

    async markAllNotificationsRead() {
        return await this.request<any>('/api/notifications/read-all', {
            method: 'POST',
        });
    }

    // ============ DASHBOARD STATS ============
    async getDashboardStats() {
        // This combines multiple API calls for dashboard data
        try {
            const [capturesRes, remindersRes] = await Promise.all([
                this.getCaptures(100, 0),
                this.getReminders(),
            ]);

            const captures = capturesRes.data || [];
            const reminders = remindersRes.data || [];

            // Calculate today's stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayCaptures = captures.filter((c: Capture) =>
                new Date(c.createdAt) >= today
            );

            // Get type breakdown
            const typeBreakdown = captures.reduce((acc: any, c: Capture) => {
                acc[c.type] = (acc[c.type] || 0) + 1;
                return acc;
            }, {});

            // Pending reminders
            const pendingReminders = reminders.filter((r: any) =>
                r.status === 'pending' && new Date(r.scheduledAt) > new Date()
            );

            return {
                success: true,
                data: {
                    todayStats: {
                        itemsSaved: todayCaptures.length,
                        totalItems: captures.length,
                    },
                    typeBreakdown,
                    upcomingReminders: pendingReminders.slice(0, 5),
                    recentCaptures: captures.slice(0, 5),
                }
            };
        } catch (error) {
            console.error('[API] Error getting dashboard stats:', error);
            return {
                success: false,
                error: 'Failed to get dashboard stats',
            };
        }
    }
}

export const api = new ApiClient();
