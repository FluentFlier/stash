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

// Unified color constants - softer dark theme
const colors = {
    bg: '#121218',           // soft dark slate
    bgSecondary: '#1c1c24',  // elevated surface
    bgTertiary: '#252530',   // input backgrounds
    primary: '#6366f1',
    primaryMuted: 'rgba(99, 102, 241, 0.12)',
    text: '#f4f4f5',
    textMuted: '#a1a1aa',
    textSubtle: '#71717a',
    border: '#3a3a48',
    borderLight: '#2d2d38',
    success: '#22c55e',
    accent: '#3b82f6',
};

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
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                            width: 36,
                            height: 36,
                            backgroundColor: colors.primaryMuted,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Sparkles size={18} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                AI Assistant
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                                <Text style={{ fontSize: 12, color: colors.textSubtle }}>Online</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Summary Card */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                    <View style={{
                        backgroundColor: colors.bgSecondary,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                        padding: 14,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Zap size={14} color={colors.accent} />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                                Daily Summary
                            </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>
                            You've saved 12 items this week. 3 upcoming events detected.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <TrendingUp size={12} color={colors.success} />
                                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted }}>
                                    +24%
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} color={colors.textSubtle} />
                                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted }}>
                                    2h saved
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={0}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            ref={scrollViewRef}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 20 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {messages.map((msg) => (
                                <View
                                    key={msg.id}
                                    style={{
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%',
                                        marginBottom: 12,
                                    }}
                                >
                                    <View style={{
                                        backgroundColor: msg.role === 'user' ? colors.primary : colors.bgSecondary,
                                        borderRadius: 12,
                                        borderWidth: msg.role === 'user' ? 0 : 1,
                                        borderColor: colors.borderLight,
                                        paddingHorizontal: 14,
                                        paddingVertical: 10,
                                    }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: colors.text,
                                            lineHeight: 20,
                                        }}>
                                            {msg.content}
                                        </Text>
                                    </View>
                                    {msg.timestamp && (
                                        <Text style={{
                                            fontSize: 10,
                                            color: colors.textSubtle,
                                            marginTop: 4,
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            marginHorizontal: 4,
                                        }}>
                                            {msg.timestamp}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    </TouchableWithoutFeedback>

                    {/* Input Container */}
                    <View style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        paddingBottom: 20,
                        borderTopWidth: 1,
                        borderTopColor: colors.borderLight,
                        backgroundColor: colors.bg,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.bgTertiary,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    paddingHorizontal: 14,
                                    paddingVertical: 12,
                                    fontSize: 14,
                                    color: colors.text,
                                    maxHeight: 100,
                                }}
                                placeholder="Ask me anything..."
                                placeholderTextColor={colors.textSubtle}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                            />
                            <Pressable
                                onPress={handleSend}
                                disabled={!message.trim()}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    backgroundColor: message.trim() ? colors.primary : colors.bgTertiary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Send size={18} color={message.trim() ? '#ffffff' : colors.textSubtle} />
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};
