// Theme colors derived from tailwind.config.js
// This file imports from the same source of truth

// Import colors from tailwind config
const tailwindConfig = require('../../tailwind.config.js');
const twColors = tailwindConfig.colors;

// Export theme object for use in inline styles
// All values come from tailwind.config.js - DO NOT HARDCODE HERE
export const theme = {
  // Pure white for text on colored backgrounds
  white: twColors.neutral[50], // #fafafa

  // Primary accent (cyan)
  primary: twColors.primary[500],
  primaryLight: twColors.primary[400],
  primaryDark: twColors.primary[600],
  primaryMuted: `rgba(6, 182, 212, 0.12)`,

  // App backgrounds
  bg: twColors.app.bg,
  bgSecondary: twColors.app.surface,
  bgTertiary: twColors.app.elevated,

  // Text colors
  text: twColors.neutral[50],
  textMuted: twColors.neutral[400],
  textSubtle: twColors.neutral[500],

  // Borders
  border: twColors.app.border,
  borderLight: twColors.app.borderLight,

  // Semantic colors
  success: twColors.success.DEFAULT,
  successMuted: twColors.success.muted,
  error: twColors.error.DEFAULT,
  errorMuted: twColors.error.muted,
  warning: twColors.warning.DEFAULT,
  warningMuted: twColors.warning.muted,
  accent: twColors.info.DEFAULT,
  accentMuted: twColors.info.muted,
};

// Button-specific colors
export const buttonColors = {
  primary: theme.primary,
  primaryContent: theme.white,
  secondary: twColors.neutral[600],
  secondaryContent: twColors.neutral[50],
  neutral: twColors.neutral[800],
  neutralContent: twColors.neutral[50],
  error: theme.error,
  errorContent: theme.white,
  outline: {
    border: theme.border,
    text: theme.text,
  },
  ghost: {
    text: theme.textMuted,
  },
};

// Export raw tailwind colors for direct access
export const colors = twColors;
