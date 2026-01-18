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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePress = (e: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(e);
    };

    // Variant styles
    const variantClasses = {
        primary: 'bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 shadow-lg shadow-primary-500/40',
        secondary: 'bg-neutral-800 border border-neutral-700',
        outline: 'bg-transparent border-2 border-primary-500',
        ghost: 'bg-transparent',
        destructive: 'bg-error shadow-md',
    };

    // Size styles
    const sizeClasses = {
        sm: 'px-4 py-2 min-h-[40px]',
        md: 'px-6 py-3 min-h-[48px]',
        lg: 'px-8 py-4 min-h-[56px]',
    };

    // Text variant styles
    const textVariantClasses = {
        primary: 'text-white',
        secondary: 'text-neutral-50',
        outline: 'text-primary-500',
        ghost: 'text-primary-500',
        destructive: 'text-white',
    };

    // Text size styles
    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    const buttonClasses = `
        rounded-xl items-center justify-center flex-row
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50' : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    const textClasses = `
        font-semibold
        ${textVariantClasses[variant]}
        ${textSizeClasses[size]}
    `.trim().replace(/\s+/g, ' ');

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            disabled={disabled || loading}
            className={buttonClasses}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'primary' || variant === 'destructive'
                            ? '#ffffff'
                            : '#7c6ff0'
                    }
                />
            ) : (
                <View className="flex-row items-center justify-center">
                    {leftIcon && <View className="mr-2">{leftIcon}</View>}
                    <Text className={textClasses}>{children}</Text>
                    {rightIcon && <View className="ml-2">{rightIcon}</View>}
                </View>
            )}
        </Pressable>
    );
};
