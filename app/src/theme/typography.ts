// Modern typography system using system fonts
export const typography = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semibold: 'System',
        bold: 'System',
    },

    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Predefined text styles
    styles: {
        h1: {
            fontSize: 48,
            lineHeight: 57.6,
            fontWeight: '700' as const,
            letterSpacing: -1,
        },
        h2: {
            fontSize: 36,
            lineHeight: 43.2,
            fontWeight: '700' as const,
            letterSpacing: -0.5,
        },
        h3: {
            fontSize: 30,
            lineHeight: 36,
            fontWeight: '600' as const,
            letterSpacing: -0.25,
        },
        h4: {
            fontSize: 24,
            lineHeight: 31.2,
            fontWeight: '600' as const,
        },
        body: {
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '400' as const,
        },
        bodyLarge: {
            fontSize: 18,
            lineHeight: 27,
            fontWeight: '400' as const,
        },
        bodyMedium: {
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '500' as const,
        },
        caption: {
            fontSize: 14,
            lineHeight: 21,
            fontWeight: '400' as const,
        },
        label: {
            fontSize: 14,
            lineHeight: 21,
            fontWeight: '500' as const,
        },
        labelLarge: {
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '600' as const,
        },
        overline: {
            fontSize: 12,
            lineHeight: 18,
            fontWeight: '600' as const,
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
        },
    },
};
