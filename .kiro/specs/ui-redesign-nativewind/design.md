# Design Document

## Overview

This document outlines the design for migrating Stash from a custom styling system to NativeWind v4, along with a complete UI redesign featuring a modern color palette, improved typography, and redesigned components. The goal is to create a visually appealing, maintainable, and performant mobile application.

## Architecture

### Technology Stack

- **NativeWind v4**: Tailwind CSS for React Native
- **Tailwind CSS v3.4+**: Utility-first CSS framework
- **React Native 0.81.5**: Mobile framework
- **Expo SDK 54**: Development platform
- **TypeScript**: Type safety

### Migration Strategy

1. **Install NativeWind**: Add nativewind and tailwindcss dependencies
2. **Configure Tailwind**: Set up tailwind.config.js with custom theme
3. **Update Babel**: Configure babel.config.js for NativeWind
4. **Migrate Components**: Convert StyleSheet to className one by one
5. **Remove Old System**: Delete custom theme files after migration
6. **Test**: Verify all screens and components work correctly

## Components and Interfaces

### NativeWind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Vibrant Blue/Purple
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#8b93f8',
          500: '#7c6ff0',
          600: '#6d4ee3',
          700: '#5d3cc8',
          800: '#4d32a3',
          900: '#412d82',
        },
        // Accent - Teal/Cyan
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Neutral - Modern Grays
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Semantic Colors
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
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
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow-primary': '0 0 20px rgba(124, 111, 240, 0.4)',
        'glow-accent': '0 0 20px rgba(6, 182, 212, 0.4)',
      },
    },
  },
  plugins: [],
}
```

### Package Dependencies

```json
{
  "dependencies": {
    "nativewind": "^4.0.1",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "^5.6.2"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1"
  }
}
```

## Data Models

### Component Props

```typescript
// Button Component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
}

// Card Component
interface CardProps {
  variant?: 'default' | 'elevated' | 'glass';
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
}

// Input Component
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  className?: string;
}

// MessageBubble Component
interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  className?: string;
}

// Avatar Component
interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  source?: ImageSourcePropType;
  fallback?: string;
  className?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: NativeWind Class Application

*For any* component using className prop, applying Tailwind utility classes should result in the correct React Native styles being applied.

**Validates: Requirements 1.2, 1.3**

### Property 2: Color Contrast Compliance

*For any* text element displayed on a background, the color contrast ratio should meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 2.3**

### Property 3: Touch Target Size

*For any* interactive element (button, pressable), the minimum touch target size should be 44x44 points.

**Validates: Requirements 7.4**

### Property 4: Component Prop Validation

*For any* component with TypeScript props, passing invalid prop types should result in a TypeScript compilation error.

**Validates: Requirements 8.4**

### Property 5: Responsive Layout

*For any* screen size within the supported range (320px to 428px width), content should display without horizontal scrolling.

**Validates: Requirements 7.1, 7.2**

### Property 6: Animation Performance

*For any* animation or transition, the frame rate should maintain at least 60fps during execution.

**Validates: Requirements 9.5**

### Property 7: Accessibility Labels

*For any* interactive element, when using a screen reader, a descriptive accessibility label should be provided.

**Validates: Requirements 10.1**

## Error Handling

### NativeWind Configuration Errors

- **Missing Tailwind Config**: Display clear error message if tailwind.config.js is not found
- **Invalid Class Names**: Log warnings for unrecognized Tailwind classes
- **Build Errors**: Provide helpful error messages during Metro bundler compilation

### Component Errors

- **Missing Required Props**: TypeScript will catch at compile time
- **Invalid Prop Values**: Use prop validation and default values
- **Render Errors**: Wrap components in Error Boundaries with fallback UI

### Performance Issues

- **Slow Renders**: Use React DevTools Profiler to identify bottlenecks
- **Memory Leaks**: Properly cleanup event listeners and subscriptions
- **Large Lists**: Use FlatList with proper optimization (getItemLayout, keyExtractor)

## Testing Strategy

### Unit Tests

- Test individual components render correctly with different props
- Test button press handlers are called
- Test input validation logic
- Test color contrast calculations
- Test accessibility label generation

### Property-Based Tests

Each correctness property will be validated through property-based testing:

1. **NativeWind Class Application**: Generate random valid Tailwind classes, apply to components, verify styles
2. **Color Contrast**: Generate random color combinations, calculate contrast ratios, verify WCAG compliance
3. **Touch Target Size**: Measure rendered component dimensions, verify minimum size
4. **Responsive Layout**: Test on various screen widths, verify no horizontal overflow
5. **Animation Performance**: Monitor frame rates during animations, verify 60fps threshold
6. **Accessibility Labels**: Query components with screen reader, verify labels exist

### Integration Tests

- Test navigation between screens
- Test form submission flows
- Test share intent handling
- Test theme switching (if light mode added)

### Visual Regression Tests

- Capture screenshots of all screens
- Compare against baseline images
- Flag any unexpected visual changes

### Manual Testing

- Test on physical iOS device (iPhone 12+)
- Test on physical Android device (Pixel 5+)
- Test with VoiceOver/TalkBack enabled
- Test with different text sizes
- Test with slow animations enabled

## Implementation Notes

### Migration Order

1. **Setup Phase**
   - Install NativeWind and Tailwind CSS
   - Configure tailwind.config.js
   - Update babel.config.js
   - Create utility helper functions

2. **Component Migration**
   - Start with smallest components (Avatar, Badge)
   - Move to medium components (Button, Input, Card)
   - Finish with complex components (MessageBubble, Screen layouts)

3. **Screen Migration**
   - Migrate one screen at a time
   - Test thoroughly after each screen
   - Update navigation styling

4. **Cleanup Phase**
   - Remove old theme files
   - Remove StyleSheet imports
   - Update documentation
   - Final testing pass

### Best Practices

- Use semantic class names (bg-primary-500 instead of bg-blue-500)
- Group related classes (layout, spacing, colors, typography)
- Extract repeated class combinations into components
- Use className prop for custom styling
- Leverage Tailwind's responsive modifiers when needed
- Document custom Tailwind extensions

### Performance Considerations

- NativeWind compiles classes at build time (no runtime overhead)
- Use memoization for expensive computations
- Avoid inline styles that cause re-renders
- Use FlatList for long lists
- Lazy load screens with React.lazy (when available)
- Optimize images with proper sizing and formats

### Accessibility Guidelines

- Always provide accessibilityLabel for interactive elements
- Use accessibilityRole to indicate element purpose
- Ensure sufficient color contrast (use contrast checker)
- Support dynamic text sizing
- Test with screen readers enabled
- Provide haptic feedback for interactions
