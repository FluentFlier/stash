export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
};

export const radius = {
    none: 0,
    sm: 6,
    md: 10,
    lg: 16,
    xl: 20,
    '2xl': 28,
    '3xl': 36,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    // Colored shadows for glass effects
    glow: {
        primary: {
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
        },
        accent: {
            shadowColor: '#06B6D4',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
        },
    },
};

// Glassmorphism effects
export const glass = {
    light: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    dark: {
        backgroundColor: 'rgba(22, 22, 31, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(161, 161, 170, 0.2)',
    },
};

// Blur intensity values (for expo-blur)
export const blur = {
    light: 'light' as const,
    regular: 'regular' as const,
    dark: 'dark' as const,
    extraLight: 'extraLight' as const,
    prominent: 'prominent' as const,
};

// Animation timing
export const animation = {
    duration: {
        fast: 150,
        normal: 250,
        slow: 350,
    },
    easing: {
        ease: 'ease' as const,
        easeIn: 'ease-in' as const,
        easeOut: 'ease-out' as const,
        easeInOut: 'ease-in-out' as const,
    },
};
