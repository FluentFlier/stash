import React from 'react';
import { View, Pressable, PressableProps } from 'react-native';
import { BlurView } from 'expo-blur';

type CardVariant = 'default' | 'elevated' | 'glass';

interface CardProps extends Omit<PressableProps, 'style'> {
    variant?: CardVariant;
    children: React.ReactNode;
    className?: string;
}

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardNew: React.FC<CardProps> & { Content: React.FC<CardContentProps> } = ({
    variant = 'default',
    onPress,
    children,
    className = '',
    ...props
}) => {
    const variantClasses = {
        default: 'bg-neutral-900 border border-neutral-700',
        elevated: 'bg-neutral-900 shadow-lg',
        glass: 'bg-neutral-900/40 border border-white/10 backdrop-blur-xl',
    };

    const baseClasses = `
        rounded-lg p-4
        ${variantClasses[variant]}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    if (variant === 'glass') {
        if (onPress) {
            return (
                <Pressable onPress={onPress} {...props}>
                    <BlurView intensity={80} tint="dark" className={baseClasses}>
                        {children}
                    </BlurView>
                </Pressable>
            );
        }
        return (
            <BlurView intensity={80} tint="dark" className={baseClasses}>
                {children}
            </BlurView>
        );
    }

    if (onPress) {
        return (
            <Pressable onPress={onPress} className={baseClasses} {...props}>
                {children}
            </Pressable>
        );
    }

    return <View className={baseClasses}>{children}</View>;
};

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
    return <View className={`gap-3 ${className}`.trim()}>{children}</View>;
};

CardNew.Content = CardContent;
