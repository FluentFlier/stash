import React from 'react';
import {
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    PressableProps,
    Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
    style?: any;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    onPress,
    style,
    ...props
}) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = (e: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(e);
    };

    const buttonContent = (
        <>
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'primary' || variant === 'destructive'
                            ? theme.colors.text.inverse
                            : theme.colors.primary
                    }
                />
            ) : (
                <View style={styles.content}>
                    {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                    <Text
                        style={[
                            styles.text,
                            styles[`text_${variant}`],
                            styles[`text_${size}`],
                        ]}
                    >
                        {children}
                    </Text>
                    {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
                </View>
            )}
        </>
    );

    const renderButton = () => {
        if (variant === 'primary') {
            return (
                <LinearGradient
                    colors={theme.colors.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.base, styles[`size_${size}`], styles.primary]}
                >
                    {buttonContent}
                </LinearGradient>
            );
        }

        if (variant === 'glass') {
            return (
                <BlurView
                    intensity={80}
                    tint="dark"
                    style={[styles.base, styles[`size_${size}`], styles.glass]}
                >
                    {buttonContent}
                </BlurView>
            );
        }

        return (
            <View style={[styles.base, styles[variant], styles[`size_${size}`]]}>
                {buttonContent}
            </View>
        );
    };

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[disabled && styles.disabled]}
                {...props}
            >
                {renderButton()}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftIcon: {
        marginRight: theme.spacing[2],
    },
    rightIcon: {
        marginLeft: theme.spacing[2],
    },

    // Variants
    primary: {
        ...theme.shadows.glow.primary,
    },
    secondary: {
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    glass: {
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.md,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    destructive: {
        backgroundColor: theme.colors.error,
        ...theme.shadows.md,
    },

    // Sizes
    size_sm: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        minHeight: 40,
    },
    size_md: {
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[3],
        minHeight: 48,
    },
    size_lg: {
        paddingHorizontal: theme.spacing[8],
        paddingVertical: theme.spacing[4],
        minHeight: 56,
    },

    // Text styles
    text: {
        fontWeight: '600',
    },
    text_primary: {
        color: theme.colors.text.inverse,
    },
    text_secondary: {
        color: theme.colors.text.primary,
    },
    text_glass: {
        color: theme.colors.text.primary,
        fontWeight: '600',
    },
    text_outline: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    text_ghost: {
        color: theme.colors.primary,
    },
    text_destructive: {
        color: theme.colors.text.inverse,
    },
    text_sm: {
        fontSize: theme.typography.fontSize.sm,
    },
    text_md: {
        fontSize: theme.typography.fontSize.base,
    },
    text_lg: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: '600',
    },

    // States
    disabled: {
        opacity: 0.5,
    },
});
