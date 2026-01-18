import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
    size?: AvatarSize;
    fallback: string;
    source?: { uri: string };
}

export const Avatar: React.FC<AvatarProps> = ({
    size = 'md',
    fallback,
    source,
}) => {
    const initials = fallback
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <View style={[styles.container, styles[size]]}>
            {source ? (
                // TODO: Add Image component when needed
                <View style={[styles.container, styles[size], styles.placeholder]} />
            ) : (
                <Text style={[styles.text, styles[`text_${size}`]]}>{initials}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        backgroundColor: theme.colors.gray[300],
    },

    // Sizes
    sm: {
        width: 32,
        height: 32,
    },
    md: {
        width: 48,
        height: 48,
    },
    lg: {
        width: 64,
        height: 64,
    },

    // Text
    text: {
        color: theme.colors.text.inverse,
        fontWeight: '600',
    },
    text_sm: {
        fontSize: theme.typography.fontSize.xs,
    },
    text_md: {
        fontSize: theme.typography.fontSize.base,
    },
    text_lg: {
        fontSize: theme.typography.fontSize.xl,
    },
});
