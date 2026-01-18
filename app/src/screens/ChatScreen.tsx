import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Sparkles, TrendingUp, Clock, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MessageBubbleNew, CardNew, AvatarNew } from '../components/ui';

type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
};

export const ChatScreen: React.FC = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your AI memory assistant. Ask me anything about your saved content, or just chat!",
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
        },
    ]);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const handleSend = () => {
        if (!message.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const newMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: message,
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };

        setMessages([...messages, newMessage]);
        setMessage('');

        // Simulate AI response
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'This is a demo response. Connect to Supabase to enable real AI chat!',
                    timestamp: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                },
            ]);
        }, 1000);
    };

    return (
        <View className="flex-1 bg-neutral-950">
            {/* Gradient Background */}
            <View className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-primary-900/20 to-neutral-950" />
            
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <View className="flex-row items-center gap-3">
                        <AvatarNew size="sm" fallback="You" />
                        <View className="gap-1">
                            <Text className="text-lg font-semibold text-neutral-50">
                                Your AI Assistant
                            </Text>
                            <View className="flex-row items-center gap-1">
                                <View className="w-2 h-2 rounded-full bg-success" />
                                <Text className="text-xs text-neutral-400">Online</Text>
                            </View>
                        </View>
                    </View>
                    <Sparkles size={24} color="#7c6ff0" />
                </View>

                {/* AI Summary Card */}
                <View className="px-4 py-3">
                    <CardNew variant="glass">
                        <CardNew.Content>
                            <View className="flex-row items-center gap-2 mb-2">
                                <Zap size={18} color="#22d3ee" />
                                <Text className="text-sm font-semibold text-neutral-50">
                                    Daily Summary
                                </Text>
                            </View>
                            <Text className="text-base text-neutral-300 mb-3">
                                You've saved 12 items this week. 3 upcoming events detected.
                            </Text>
                            <View className="flex-row gap-4">
                                <View className="flex-row items-center gap-1">
                                    <TrendingUp size={16} color="#10b981" />
                                    <Text className="text-sm font-semibold text-neutral-300">
                                        +24%
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <Clock size={16} color="#a3a3a3" />
                                    <Text className="text-sm font-semibold text-neutral-300">
                                        2h saved
                                    </Text>
                                </View>
                            </View>
                        </CardNew.Content>
                    </CardNew>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            ref={scrollViewRef}
                            className="flex-1"
                            contentContainerClassName="py-4"
                            keyboardShouldPersistTaps="handled"
                        >
                            {messages.map((msg) => (
                                <MessageBubbleNew
                                    key={msg.id}
                                    role={msg.role}
                                    content={msg.content}
                                    timestamp={msg.timestamp}
                                />
                            ))}
                        </ScrollView>
                    </TouchableWithoutFeedback>

                    <View className="px-4 py-3 border-t border-neutral-800 bg-neutral-950">
                        <View className="flex-row items-end gap-2">
                            <TextInput
                                className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-base text-neutral-50 max-h-[100px] border border-neutral-700"
                                placeholder="Ask me anything..."
                                placeholderTextColor="#a3a3a3"
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                                returnKeyType="default"
                                blurOnSubmit={false}
                            />
                            <Pressable
                                onPress={handleSend}
                                disabled={!message.trim()}
                                className={`w-11 h-11 rounded-full items-center justify-center ${
                                    message.trim()
                                        ? 'bg-gradient-to-r from-primary-600 to-accent-500'
                                        : 'bg-neutral-700'
                                }`}
                            >
                                <Send size={20} color="#ffffff" />
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};
