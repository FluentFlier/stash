// Shared theme colors - single source of truth
// Update these values to change colors across the entire app

export const theme = {
  // Main accent color (cyan from tailwind config)
  primary: '#06b6d4',
  primaryLight: '#22d3ee',
  primaryDark: '#0891b2',
  primaryMuted: 'rgba(6, 182, 212, 0.12)',

  // Backgrounds - softer dark theme
  bg: '#121218',
  bgSecondary: '#1c1c24',
  bgTertiary: '#252530',

  // Text colors
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textSubtle: '#71717a',

  // Borders
  border: '#3a3a48',
  borderLight: '#2d2d38',

  // Semantic colors
  success: '#22c55e',
  successMuted: 'rgba(34, 197, 94, 0.12)',
  error: '#ef4444',
  errorMuted: 'rgba(239, 68, 68, 0.1)',
  warning: '#f97316',
  warningMuted: 'rgba(249, 115, 22, 0.12)',
  accent: '#3b82f6',
  accentMuted: 'rgba(59, 130, 246, 0.12)',
};

// For ButtonNew variants
export const buttonColors = {
  primary: theme.primary,
  primaryContent: '#ffffff',
  secondary: '#52525b',
  secondaryContent: '#fafafa',
  neutral: '#27272a',
  neutralContent: '#fafafa',
  error: theme.error,
  errorContent: '#ffffff',
  outline: {
    border: theme.border,
    text: theme.text,
  },
  ghost: {
    text: theme.textMuted,
  },
};
