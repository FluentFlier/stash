import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    glass?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    style,
    glass = false,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const labelAnim = React.useRef(new Animated.Value(label ? 1 : 0)).current;
    const borderAnim = React.useRef(new Animated.Value(0)).current;

    const handleFocus = (e: any) => {
        setIsFocused(true);
        Animated.parallel([
            Animated.timing(labelAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(borderAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (!props.value) {
            Animated.timing(labelAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
        Animated.timing(borderAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onBlur?.(e);
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.border, theme.colors.primary],
    });

    const inputContainer = (
        <Animated.View
            style={[
                styles.inputContainer,
                glass && styles.inputGlass,
                error && styles.inputError,
                { borderColor },
            ]}
        >
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor={theme.colors.text.tertiary}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...props}
            />
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            {glass ? (
                <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
                    {inputContainer}
                </BlurView>
            ) : (
                inputContainer
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing[4],
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[2],
    },
    blurContainer: {
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.xl,
        paddingHorizontal: theme.spacing[4],
        minHeight: 52,
    },
    inputGlass: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.borderLight,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    input: {
        flex: 1,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        paddingVertical: theme.spacing[3],
    },
    leftIcon: {
        marginRight: theme.spacing[3],
    },
    rightIcon: {
        marginLeft: theme.spacing[3],
    },
    errorText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.error,
        marginTop: theme.spacing[2],
        fontWeight: '500',
    },
});
