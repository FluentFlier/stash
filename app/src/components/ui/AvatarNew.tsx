import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
    size?: AvatarSize;
    source?: ImageSourcePropType;
    fallback?: string;
    className?: string;
}

export const AvatarNew: React.FC<AvatarProps> = ({
    size = 'md',
    source,
    fallback = '?',
    className = '',
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-base',
        lg: 'text-xl',
    };

    const containerClasses = `
        ${sizeClasses[size]}
        rounded-full
        items-center justify-center
        border-2 border-neutral-800
        overflow-hidden
        ${className}
    `.trim().replace(/\s+/g, ' ');

    if (source) {
        return (
            <View className={containerClasses}>
                <Image
                    source={source}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            </View>
        );
    }

    // Get initials from fallback text
    const getInitials = (text: string) => {
        const words = text.trim().split(' ');
        if (words.length >= 2) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase();
        }
        return text.slice(0, 2).toUpperCase();
    };

    return (
        <View className={`${containerClasses} bg-gradient-to-br from-primary-600 to-accent-500`}>
            <Text className={`${textSizeClasses[size]} font-bold text-white`}>
                {getInitials(fallback)}
            </Text>
        </View>
    );
};
