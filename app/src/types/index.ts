export type RootStackParamList = {
    Landing: undefined;
    Login: undefined;
    SignUp: undefined;
    Onboarding: undefined;
    Main: undefined;
    Notifications: undefined;
};

export type MainTabParamList = {
    Dashboard: undefined;
    Memory: undefined;
    AddContext: undefined;
    Chat: undefined;
    Profile: undefined;
};

export type User = {
    id: string;
    email: string;
    name: string;
    role?: string;
    age?: number;
    googleCalendarConnected: boolean;
    notificationsEnabled: boolean;
};

export type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
};

export type ContextItem = {
    id: string;
    type: 'image' | 'video' | 'link' | 'text';
    content: string;
    caption?: string;
    status: 'processing' | 'ready' | 'failed';
    extractedData?: {
        text?: string;
        entities?: string[];
        suggestedActions?: any[];
    };
    createdAt: string;
};
