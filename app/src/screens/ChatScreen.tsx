import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Sparkles, User, TrendingUp, Clock, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MessageBubble, Card, Avatar } from '../components/ui';
import { theme } from '../theme';

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
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    theme.colors.dark.background,
                    theme.colors.primary[900],
                    theme.colors.dark.background,
                ]}
                locations={[0, 0.2, 1]}
                style={styles.gradient}
            />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Enhanced Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Avatar size="sm" fallback="You" />
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Your AI Assistant</Text>
                            <View style={styles.statusRow}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Online</Text>
                            </View>
                        </View>
                    </View>
                    <Sparkles size={24} color={theme.colors.primary[400]} />
                </View>

                {/* AI Summary Card */}
                <View style={styles.summaryContainer}>
                    <Card variant="glass">
                        <Card.Content>
                            <View style={styles.summaryHeader}>
                                <Zap size={18} color={theme.colors.accent[400]} />
                                <Text style={styles.summaryTitle}>Daily Summary</Text>
                            </View>
                            <Text style={styles.summaryText}>
                                You've saved 12 items this week. 3 upcoming events detected.
                            </Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <TrendingUp size={16} color={theme.colors.success[400]} />
                                    <Text style={styles.statText}>+24%</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Clock size={16} color={theme.colors.text.tertiary} />
                                    <Text style={styles.statText}>2h saved</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                    keyboardVerticalOffset={90}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messages}
                        contentContainerStyle={styles.messagesContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                role={msg.role}
                                content={msg.content}
                                timestamp={msg.timestamp}
                            />
                        ))}
                    </ScrollView>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ask me anything..."
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                            />
                            <Pressable
                                onPress={handleSend}
                                style={[
                                    styles.sendButton,
                                    !message.trim() && styles.sendButtonDisabled,
                                ]}
                                disabled={!message.trim()}
                            >
                                <LinearGradient
                                    colors={
                                        message.trim()
                                            ? [theme.colors.primary[600], theme.colors.primary[500], theme.colors.accent[500]]
                                            : [theme.colors.gray[700], theme.colors.gray[700]]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.sendButtonGradient}
                                >
                                    <Send size={20} color={theme.colors.text.inverse} />
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
    },
    headerText: {
        gap: theme.spacing[1],
    },
    title: {
        ...theme.typography.styles.h4,
        color: theme.colors.text.primary,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.success[400],
    },
    statusText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.tertiary,
    },
    summaryContainer: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        marginBottom: theme.spacing[2],
    },
    summaryTitle: {
        ...theme.typography.styles.labelLarge,
        color: theme.colors.text.primary,
    },
    summaryText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing[3],
    },
    statsRow: {
        flexDirection: 'row',
        gap: theme.spacing[4],
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    statText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    keyboardView: {
        flex: 1,
    },
    messages: {
        flex: 1,
    },
    messagesContent: {
        paddingVertical: theme.spacing[4],
    },
    inputContainer: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        backgroundColor: theme.colors.dark.backgroundSecondary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: theme.spacing[2],
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius.xl,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    sendButton: {
        borderRadius: theme.radius.full,
        overflow: 'hidden',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonGradient: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
