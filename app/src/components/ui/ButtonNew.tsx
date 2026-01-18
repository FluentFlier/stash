import React from 'react';
import {
    Pressable,
    Text,
    ActivityIndicator,
    View,
    PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

// Color scheme based on user's theme
const colors = {
    primary: '#6366f1',      // accent - indigo
    primaryContent: '#ffffff',
    secondary: '#52525b',    // neutral gray
    secondaryContent: '#fafafa',
    accent: '#6366f1',       // indigo
    neutral: '#27272a',      // dark neutral for backgrounds
    neutralContent: '#fafafa',
    error: '#ef4444',
    errorContent: '#ffffff',
    border: '#3f3f46',       // zinc-700
    textMuted: '#a1a1aa',    // zinc-400
};

export const ButtonNew: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    onPress,
    className = '',
    ...props
}) => {
    const handlePressIn = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            // Ignore haptic errors
        }
    };

    const handlePress = (e: any) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            // Ignore haptic errors
        }
        onPress?.(e);
    };

    // Get background style based on variant
    const getBackgroundStyle = () => {
        switch (variant) {
            case 'primary':
                return { backgroundColor: colors.primary };
            case 'secondary':
                return { backgroundColor: colors.secondary };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.border
                };
            case 'ghost':
                return { backgroundColor: 'transparent' };
            case 'destructive':
                return { backgroundColor: colors.error };
            default:
                return { backgroundColor: colors.primary };
        }
    };

    // Size styles - smaller, more refined
    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return { paddingHorizontal: 12, paddingVertical: 6, minHeight: 32 };
            case 'md':
                return { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 };
            case 'lg':
                return { paddingHorizontal: 20, paddingVertical: 12, minHeight: 48 };
            default:
                return { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 };
        }
    };

    // Text color based on variant
    const getTextColor = () => {
        switch (variant) {
            case 'primary':
            case 'destructive':
                return colors.primaryContent;
            case 'secondary':
                return colors.secondaryContent;
            case 'outline':
                return colors.neutralContent;
            case 'ghost':
                return colors.textMuted;
            default:
                return colors.primaryContent;
        }
    };

    // Text size - smaller for cleaner look
    const getTextSize = () => {
        switch (size) {
            case 'sm':
                return 12;
            case 'md':
                return 13;
            case 'lg':
                return 14;
            default:
                return 13;
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            disabled={disabled || loading}
            className={className}
            style={[
                {
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    borderRadius: 8,
                    opacity: disabled || loading ? 0.5 : 1,
                },
                getBackgroundStyle(),
                getSizeStyle(),
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || loading }}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'outline' || variant === 'ghost'
                            ? colors.textMuted
                            : colors.primaryContent
                    }
                    size="small"
                />
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    {leftIcon && <View style={{ marginRight: 6 }}>{leftIcon}</View>}
                    <Text
                        style={{
                            color: getTextColor(),
                            fontSize: getTextSize(),
                            fontWeight: '500',
                            letterSpacing: 0.2,
                        }}
                    >
                        {children}
                    </Text>
                    {rightIcon && <View style={{ marginLeft: 6 }}>{rightIcon}</View>}
                </View>
            )}
        </Pressable>
    );
};
