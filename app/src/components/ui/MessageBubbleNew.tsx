import React from 'react';
import { View, Text } from 'react-native';

interface MessageBubbleProps {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
    className?: string;
}

export const MessageBubbleNew: React.FC<MessageBubbleProps> = ({
    role,
    content,
    timestamp,
    className = '',
}) => {
    if (role === 'system') {
        return (
            <View className={`items-center py-2 ${className}`.trim()}>
                <Text className="text-xs text-neutral-400 text-center">
                    {content}
                </Text>
            </View>
        );
    }

    const isUser = role === 'user';

    const containerClasses = `
        px-4 mb-3
        ${isUser ? 'items-end' : 'items-start'}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    const bubbleClasses = `
        max-w-[80%] px-4 py-3 rounded-2xl
        ${isUser 
            ? 'bg-gradient-to-r from-primary-600 to-accent-500 rounded-br-sm' 
            : 'bg-neutral-800 rounded-bl-sm'
        }
    `.trim().replace(/\s+/g, ' ');

    return (
        <View className={containerClasses}>
            <View className={bubbleClasses}>
                <Text className={`text-base ${isUser ? 'text-white' : 'text-neutral-50'}`}>
                    {content}
                </Text>
                {timestamp && (
                    <Text className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-neutral-400'}`}>
                        {timestamp}
                    </Text>
                )}
            </View>
        </View>
    );
};
