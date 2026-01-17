import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme';

type MessageRole = 'user' | 'assistant' | 'system';

interface MessageBubbleProps {
    role: MessageRole;
    content: string;
    timestamp?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    role,
    content,
    timestamp,
}) => {
    const slideAnim = useRef(new Animated.Value(20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const isUser = role === 'user';
    const isSystem = role === 'system';

    if (isSystem) {
        return (
            <Animated.View
                style={[
                    styles.container,
                    styles.systemContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.systemBubble}>
                    <Text style={styles.systemText}>{content}</Text>
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.container,
                isUser ? styles.userContainer : styles.assistantContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {isUser ? (
                <View style={styles.userBubble}>
                    <Text style={styles.userText}>{content}</Text>
                    {timestamp && (
                        <Text style={styles.userTimestamp}>{timestamp}</Text>
                    )}
                </View>
            ) : (
                <BlurView intensity={60} tint="dark" style={styles.assistantBlur}>
                    <View style={styles.assistantBubble}>
                        <Text style={styles.assistantText}>{content}</Text>
                        {timestamp && (
                            <Text style={styles.assistantTimestamp}>{timestamp}</Text>
                        )}
                    </View>
                </BlurView>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
    },
    userContainer: {
        alignItems: 'flex-end',
    },
    assistantContainer: {
        alignItems: 'flex-start',
    },
    systemContainer: {
        alignItems: 'center',
    },

    // User message (gradient)
    userBubble: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        borderRadius: theme.radius.xl,
        maxWidth: '80%',
        ...theme.shadows.md,
    },
    userText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.fontSize.base,
        lineHeight: 22,
    },
    userTimestamp: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.fontSize.xs,
        marginTop: theme.spacing[1],
        opacity: 0.7,
    },

    // Assistant message (glass)
    assistantBlur: {
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        maxWidth: '80%',
    },
    assistantBubble: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    assistantText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize.base,
        lineHeight: 22,
    },
    assistantTimestamp: {
        color: theme.colors.text.tertiary,
        fontSize: theme.typography.fontSize.xs,
        marginTop: theme.spacing[1],
    },

    // System message
    systemBubble: {
        backgroundColor: theme.colors.surfaceElevated,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    systemText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.fontSize.sm,
        textAlign: 'center',
    },
});
