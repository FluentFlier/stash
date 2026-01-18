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
import { theme } from '../theme';
import { api } from '../utils/api';

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

    const handleSend = async () => {
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

        setMessages(prev => [...prev, newMessage]);
        setMessage('');

        // Real AI response
        try {
            const response = await api.chat(message);

            if (response.success && response.data) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: response.data?.message || "Error",
                        timestamp: new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: "Sorry, I couldn't process that. Please try again.",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                ]);
            }
        } catch (e) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "Network error. Please check your connection.",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.borderLight,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                            width: 36,
                            height: 36,
                            backgroundColor: theme.primaryMuted,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Sparkles size={18} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                                AI Assistant
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.success }} />
                                <Text style={{ fontSize: 12, color: theme.textSubtle }}>Online</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Summary Card */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                    <View style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        padding: 14,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Zap size={14} color={theme.accent} />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                                Daily Summary
                            </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 10 }}>
                            You've saved 12 items this week. 3 upcoming events detected.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <TrendingUp size={12} color={theme.success} />
                                <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textMuted }}>
                                    +24%
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} color={theme.textSubtle} />
                                <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textMuted }}>
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
                                        backgroundColor: msg.role === 'user' ? theme.primary : theme.bgSecondary,
                                        borderRadius: 12,
                                        borderWidth: msg.role === 'user' ? 0 : 1,
                                        borderColor: theme.borderLight,
                                        paddingHorizontal: 14,
                                        paddingVertical: 10,
                                    }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: msg.role === 'user' ? theme.white : theme.text,
                                            lineHeight: 20,
                                        }}>
                                            {msg.content}
                                        </Text>
                                    </View>
                                    {msg.timestamp && (
                                        <Text style={{
                                            fontSize: 10,
                                            color: theme.textSubtle,
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
                        borderTopColor: theme.borderLight,
                        backgroundColor: theme.bg,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.bgTertiary,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    paddingHorizontal: 14,
                                    paddingVertical: 12,
                                    fontSize: 14,
                                    color: theme.text,
                                    maxHeight: 100,
                                }}
                                placeholder="Ask me anything..."
                                placeholderTextColor={theme.textSubtle}
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
                                    backgroundColor: message.trim() ? theme.primary : theme.bgTertiary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Send size={18} color={message.trim() ? theme.white : theme.textSubtle} />
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};
