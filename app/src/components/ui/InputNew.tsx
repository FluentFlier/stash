import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, KeyboardTypeOptions } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    className?: string;
}

export const InputNew: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const containerClasses = `gap-2 ${className}`.trim();

    const inputWrapperClasses = `
        flex-row items-center gap-3
        bg-neutral-800 px-4 py-3
        border
        ${error ? 'border-error' : isFocused ? 'border-primary-500' : 'border-neutral-700'}
    `.trim().replace(/\s+/g, ' ');

    const inputWrapperStyle = {
        borderRadius: 12, // Force 12px border radius (md)
    };

    return (
        <View className={containerClasses}>
            {label && (
                <Text className="text-sm font-semibold text-neutral-50">
                    {label}
                </Text>
            )}
            <View className={inputWrapperClasses} style={inputWrapperStyle}>
                {leftIcon && (
                    <View className="opacity-60">{leftIcon}</View>
                )}
                <TextInput
                    className="flex-1 text-base text-neutral-50"
                    placeholderTextColor="#a3a3a3"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    accessibilityLabel={label}
                    accessibilityHint={error}
                    {...props}
                />
                {rightIcon && (
                    <View className="opacity-60">{rightIcon}</View>
                )}
            </View>
            {error && (
                <Text className="text-sm text-error">
                    {error}
                </Text>
            )}
        </View>
    );
};
