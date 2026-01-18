/** @type {import('tailwindcss').Config} */

// ============================================
// SINGLE SOURCE OF TRUTH FOR ALL APP COLORS
// Update these values to change colors app-wide
// ============================================
const colors = {
  // Primary accent — Ink / Black
  primary: {
    50: '#f2f4f8',
    100: '#e5e9f0',
    200: '#cfd6e3',
    300: '#aeb8cd',
    400: '#8b98b6',
    500: '#000000', // Main accent (ink)
    600: '#000000',
    700: '#000000',
    800: '#000000',
    900: '#000000',
  },

  // Secondary — Muted blue-gray
  secondary: {
    50: '#f7f9fc',
    100: '#eef2f8',
    200: '#dde3ef',
    300: '#c3ccdf',
    400: '#9aa7c4',
    500: '#4b5b78',
    600: '#404f6a',
    700: '#35425a',
    800: '#2b3548',
    900: '#202836',
  },

  // App backgrounds — Light, blue-tinted surfaces
  app: {
    bg: '#f8faff',        // base-100
    surface: '#f1f5fb',   // base-200
    elevated: '#e6ebf4',  // base-300
    border: '#d8deea',
    borderLight: '#e6ebf4',
  },

  // Neutral — Editorial ink scale
  neutral: {
    50: '#f8faff',
    100: '#f1f5fb',
    200: '#e6ebf4',
    300: '#d2d9e6',
    400: '#a8b2c6',
    500: '#7b879f',
    600: '#55607a',
    700: '#3b445c',
    800: '#232b3f',
    900: '#1c2433',
    950: '#111827',
  },

  // Semantic
  success: {
    DEFAULT: '#22c55e',
    light: '#4ade80',
    dark: '#16a34a',
    muted: 'rgba(34, 197, 94, 0.12)',
  },
  warning: {
    DEFAULT: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    muted: 'rgba(245, 158, 11, 0.12)',
  },
  error: {
    DEFAULT: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    muted: 'rgba(239, 68, 68, 0.1)',
  },
  info: {
    DEFAULT: '#4f5dff', // accent oklch(54% 0.245 262)
    light: '#7a85ff',
    dark: '#3f4ae6',
    muted: 'rgba(79, 93, 255, 0.12)',
  },
};

// Export colors for use in theme/colors.ts
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ...colors,
        // Convenience aliases for common backgrounds
        background: colors.app.bg,
        surface: colors.app.surface,
        elevated: colors.app.elevated,
      },
      backgroundColor: {
        app: colors.app.bg,
        surface: colors.app.surface,
        elevated: colors.app.elevated,
      },
      borderColor: {
        app: colors.app.border,
        'app-light': colors.app.borderLight,
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '14px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['17px', { lineHeight: '26px' }],
        xl: ['19px', { lineHeight: '28px' }],
        '2xl': ['23px', { lineHeight: '30px' }],
        '3xl': ['28px', { lineHeight: '34px' }],
        '4xl': ['34px', { lineHeight: '40px' }],
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px',
      },
    },
  },
  plugins: [],
  // Export colors object for theme/colors.ts
  colors: colors,
};
