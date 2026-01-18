import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, shadows, glass, blur, animation } from './tokens';

export type ColorScheme = 'light' | 'dark';

export const lightTheme = {
    colors: {
        ...colors,
        background: colors.light.background,
        backgroundSecondary: colors.light.backgroundSecondary,
        surface: colors.light.surface,
        surfaceElevated: colors.light.surfaceElevated,
        border: colors.light.border,
        borderLight: colors.light.borderLight,
        overlay: colors.light.overlay,
        text: colors.light.text,
        primary: colors.primary[500],
        primaryDark: colors.primary[600],
        accent: colors.accent[500],
        success: colors.success[500],
        warning: colors.warning[500],
        error: colors.error[500],
    },
    typography,
    spacing,
    radius,
    shadows,
    glass: glass.light,
    blur,
    animation,
};

export const darkTheme = {
    colors: {
        ...colors,
        background: colors.dark.background,
        backgroundSecondary: colors.dark.backgroundSecondary,
        surface: colors.dark.surface,
        surfaceElevated: colors.dark.surfaceElevated,
        border: colors.dark.border,
        borderLight: colors.dark.borderLight,
        overlay: colors.dark.overlay,
        text: colors.dark.text,
        primary: colors.primary[500],
        primaryDark: colors.primary[600],
        accent: colors.accent[500],
        success: colors.success[500],
        warning: colors.warning[500],
        error: colors.error[500],
    },
    typography,
    spacing,
    radius,
    shadows,
    glass: glass.dark,
    blur,
    animation,
};

export type Theme = typeof lightTheme;

// Default to dark theme (dark mode native)
export const theme = darkTheme;

