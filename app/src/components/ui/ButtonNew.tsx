import React from 'react';
import {
    Pressable,
    Text,
    ActivityIndicator,
    View,
    PressableProps,
    StyleProp,
    ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme, buttonColors } from '../../theme';

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
    style?: StyleProp<ViewStyle>;
}

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
    style,
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
                return { backgroundColor: buttonColors.primary };
            case 'secondary':
                return { backgroundColor: buttonColors.secondary };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: buttonColors.outline.border
                };
            case 'ghost':
                return { backgroundColor: 'transparent' };
            case 'destructive':
                return { backgroundColor: buttonColors.error };
            default:
                return { backgroundColor: buttonColors.primary };
        }
    };

    // Size styles
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
                return buttonColors.primaryContent;
            case 'secondary':
                return buttonColors.secondaryContent;
            case 'outline':
                return buttonColors.outline.text;
            case 'ghost':
                return buttonColors.ghost.text;
            default:
                return buttonColors.primaryContent;
        }
    };

    // Text size
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
                style,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || loading }}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'outline' || variant === 'ghost'
                            ? theme.textMuted
                            : buttonColors.primaryContent
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
