import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = 'http://localhost:4000'; // Backend runs on port 4000

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
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

            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'An error occurred',
                };
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // Auth endpoints
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

    // Captures endpoints
    async getCaptures(limit = 50, offset = 0) {
        return await this.request<any[]>(`/api/captures?limit=${limit}&offset=${offset}`, {
            method: 'GET',
        });
    }

    async createCapture(data: {
        type: string;
        content: string;
        userInput?: string;
    }) {
        return await this.request<any>('/api/captures', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

export const api = new ApiClient();
