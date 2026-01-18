// Modern, vibrant color palette with glassmorphism support
export const colors = {
  // Primary - Electric Purple/Indigo
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main brand color
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Accent - Vibrant Cyan/Teal
  accent: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4', // Main accent
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },

  // Success - Vibrant Emerald
  success: {
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
  },

  // Warning - Vibrant Amber
  warning: {
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },

  // Error - Vibrant Rose
  error: {
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
  },

  // Neutrals - Clean grays
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },

  // Gradients for backgrounds
  gradients: {
    primary: ['#6366F1', '#8B5CF6', '#A855F7'],
    accent: ['#06B6D4', '#3B82F6', '#6366F1'],
    sunset: ['#F59E0B', '#F97316', '#EF4444'],
    ocean: ['#06B6D4', '#0EA5E9', '#3B82F6'],
    aurora: ['#8B5CF6', '#EC4899', '#F43F5E'],
  },

  // Semantic colors (light mode)
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E4E4E7',
    borderLight: 'rgba(228, 228, 231, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    text: {
      primary: '#18181B',
      secondary: '#71717A',
      tertiary: '#A1A1AA',
      inverse: '#FFFFFF',
    },
  },

  // Semantic colors (dark mode) - Deep, rich backgrounds
  dark: {
    background: '#0A0A0F',
    backgroundSecondary: '#13131A',
    surface: 'rgba(22, 22, 31, 0.8)', // Glass effect
    surfaceElevated: 'rgba(31, 31, 46, 0.9)', // Glass effect
    border: 'rgba(82, 82, 91, 0.3)',
    borderLight: 'rgba(161, 161, 170, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    text: {
      primary: '#FAFAFA',
      secondary: '#A1A1AA',
      tertiary: '#71717A',
      inverse: '#18181B',
    },
  },

  // Glass effect colors (for glassmorphism)
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundStrong: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(255, 255, 255, 0.3)',
    },
    dark: {
      background: 'rgba(22, 22, 31, 0.6)',
      backgroundStrong: 'rgba(31, 31, 46, 0.8)',
      border: 'rgba(161, 161, 170, 0.2)',
    },
  },
};
