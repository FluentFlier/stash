import React from 'react';
import {
    View,
    Pressable,
    StyleSheet,
    PressableProps,
    Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme';

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'glass';

interface CardProps extends Omit<PressableProps, 'style'> {
    variant?: CardVariant;
    children: React.ReactNode;
    style?: any;
}

interface CardComponent extends React.FC<CardProps> {
    Content: React.FC<{ children: React.ReactNode }>;
}

export const Card: CardComponent = Object.assign(
    ({ variant = 'elevated', children, onPress, style, ...props }: CardProps) => {
        const scaleAnim = React.useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            if (onPress) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Animated.spring(scaleAnim, {
                    toValue: 0.98,
                    useNativeDriver: true,
                }).start();
            }
        };

        const handlePressOut = () => {
            if (onPress) {
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: true,
                }).start();
            }
        };

        const handlePress = (e: any) => {
            if (onPress) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress(e);
            }
        };

        const cardContent = variant === 'glass' ? (
            <BlurView intensity={60} tint="dark" style={[styles.blurContainer, style]}>
                <View style={[styles.base, styles.glassInner]}>{children}</View>
            </BlurView>
        ) : (
            <View style={[styles.base, styles[variant], style]}>{children}</View>
        );

        if (onPress) {
            return (
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Pressable
                        onPress={handlePress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        {...props}
                    >
                        {cardContent}
                    </Pressable>
                </Animated.View>
            );
        }

        return cardContent;
    },
    {
        Content: ({ children }: { children: React.ReactNode }) => {
            return <View style={styles.content}>{children}</View>;
        },
    }
);

const styles = StyleSheet.create({
    base: {
        borderRadius: theme.radius['2xl'],
        overflow: 'hidden',
    },
    blurContainer: {
        borderRadius: theme.radius['2xl'],
        overflow: 'hidden',
    },
    content: {
        padding: theme.spacing[5],
    },

    // Variants
    elevated: {
        backgroundColor: theme.colors.surfaceElevated,
        ...theme.shadows.lg,
    },
    outlined: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
    },
    filled: {
        backgroundColor: theme.colors.surfaceElevated,
    },
    glassInner: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
});
