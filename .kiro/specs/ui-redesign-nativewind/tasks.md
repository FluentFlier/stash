# Implementation Plan: UI Redesign and NativeWind Migration

## Overview

This plan outlines the step-by-step migration from the custom styling system to NativeWind v4, along with a complete UI redesign. Tasks are organized to minimize disruption and allow for incremental testing.

## Tasks

- [x] 1. Setup NativeWind and Tailwind CSS
  - Install nativewind@^4.0.1 and tailwindcss@^3.4.1
  - Create tailwind.config.js with custom theme (colors, fonts, spacing)
  - Update babel.config.js to include nativewind/babel preset
  - Update metro.config.js for CSS support
  - Test that Tailwind classes compile correctly
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Create utility components and helpers
  - [x] 2.1 Create new Button component with NativeWind
    - Implement 5 variants (primary, secondary, outline, ghost, destructive)
    - Implement 3 sizes (sm, md, lg)
    - Add loading state with ActivityIndicator
    - Add press animations with react-native-reanimated
    - Add haptic feedback
    - _Requirements: 4.1, 6.1_

  - [x] 2.2 Create new Card component with NativeWind
    - Implement 3 variants (default, elevated, glass)
    - Add optional onPress for pressable cards
    - Add proper shadows and border radius
    - _Requirements: 4.2_

  - [x] 2.3 Create new Input component with NativeWind
    - Add label and error message support
    - Add left and right icon slots
    - Implement focus states with border color changes
    - Add validation error styling
    - _Requirements: 4.3_

  - [x] 2.4 Create new MessageBubble component with NativeWind
    - Differentiate user, assistant, and system messages
    - Add timestamp display
    - Add proper spacing and alignment
    - Use different colors for each role
    - _Requirements: 4.4_

  - [x] 2.5 Create new Avatar component with NativeWind
    - Implement 3 sizes (sm, md, lg)
    - Add image source support
    - Add fallback with initials
    - Add circular border and background
    - _Requirements: 4.5_

- [ ] 3. Checkpoint - Test new components
  - Ensure all new components render correctly
  - Test all variants and sizes
  - Verify animations and interactions work
  - Ask the user if questions arise

- [x] 4. Migrate ChatScreen to NativeWind
  - [x] 4.1 Update ChatScreen layout with Tailwind classes
    - Replace StyleSheet with className props
    - Update header styling
    - Update message list styling
    - Update input container styling
    - _Requirements: 5.1, 5.4_

  - [x] 4.2 Integrate new MessageBubble component
    - Replace old MessageBubble with new version
    - Test message rendering for all roles
    - Verify scrolling and auto-scroll behavior
    - _Requirements: 4.4, 5.1_

  - [x] 4.3 Integrate new Button and Input components
    - Replace send button with new Button component
    - Update input field styling
    - Test keyboard behavior and animations
    - _Requirements: 4.1, 4.3_

- [x] 5. Migrate AddContextScreen to NativeWind
  - [x] 5.1 Update AddContextScreen layout with Tailwind classes
    - Replace StyleSheet with className props
    - Update header styling
    - Update type selection grid
    - Update form sections
    - _Requirements: 5.2, 5.4_

  - [x] 5.2 Integrate new Card and Button components
    - Replace old Card with new version
    - Replace all buttons with new Button component
    - Test type selection interactions
    - _Requirements: 4.1, 4.2_

  - [x] 5.3 Integrate new Input component
    - Replace link and text inputs with new Input component
    - Add validation error display
    - Test form submission flow
    - _Requirements: 4.3_

- [x] 6. Migrate ProfileScreen to NativeWind
  - [x] 6.1 Update ProfileScreen layout with Tailwind classes
    - Replace StyleSheet with className props
    - Update profile header with Avatar
    - Update settings sections
    - _Requirements: 5.3, 5.4_

  - [x] 6.2 Integrate new Avatar, Card, and Button components
    - Add new Avatar component for profile picture
    - Replace cards with new Card component
    - Replace buttons with new Button component
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 7. Migrate authentication screens to NativeWind
  - [ ] 7.1 Update LandingScreen with Tailwind classes
    - Replace StyleSheet with className props
    - Update hero section styling
    - Update call-to-action buttons
    - _Requirements: 5.4_

  - [ ] 7.2 Update LoginScreen with Tailwind classes
    - Replace StyleSheet with className props
    - Integrate new Input components
    - Integrate new Button components
    - Add form validation styling
    - _Requirements: 4.1, 4.3, 5.4_

  - [ ] 7.3 Update SignUpScreen with Tailwind classes
    - Replace StyleSheet with className props
    - Integrate new Input components
    - Integrate new Button components
    - Add form validation styling
    - _Requirements: 4.1, 4.3, 5.4_

  - [ ] 7.4 Update OnboardingScreen with Tailwind classes
    - Replace StyleSheet with className props
    - Update step indicators
    - Integrate new Button components
    - _Requirements: 4.1, 5.4_

- [ ] 8. Update navigation styling
  - [ ] 8.1 Update tab bar styling with NativeWind
    - Update tab bar background and borders
    - Update active/inactive icon colors
    - Update label styling
    - _Requirements: 5.4_

  - [ ] 8.2 Update stack navigator styling
    - Update screen background colors
    - Update header styling (if used)
    - Test navigation transitions
    - _Requirements: 5.4, 6.2_

- [ ] 9. Checkpoint - Test all screens
  - Navigate through all screens
  - Test all interactions and forms
  - Verify consistent styling across app
  - Ask the user if questions arise

- [ ] 10. Remove old theme system
  - [ ] 10.1 Delete old theme files
    - Delete src/theme/colors.ts
    - Delete src/theme/typography.ts
    - Delete src/theme/tokens.ts
    - Delete src/theme/index.ts
    - _Requirements: 8.1_

  - [ ] 10.2 Remove old component files
    - Delete old Button.tsx (if separate from new one)
    - Delete old Card.tsx (if separate from new one)
    - Delete old Input.tsx (if separate from new one)
    - Remove any unused component files
    - _Requirements: 8.1_

  - [ ] 10.3 Clean up imports
    - Remove StyleSheet imports from all files
    - Remove old theme imports
    - Verify no broken imports remain
    - _Requirements: 8.1, 8.3_

- [ ] 11. Add animations and polish
  - [ ] 11.1 Add screen transition animations
    - Configure React Navigation transitions
    - Add fade/slide animations between screens
    - Test on iOS and Android
    - _Requirements: 6.2_

  - [ ] 11.2 Add loading states
    - Add skeleton loaders for content
    - Add spinner for async operations
    - Add progress indicators where needed
    - _Requirements: 6.3_

  - [ ] 11.3 Add success/error feedback
    - Implement toast notifications
    - Add success animations
    - Add error shake animations
    - _Requirements: 6.4_

- [ ] 12. Accessibility improvements
  - [ ] 12.1 Add accessibility labels
    - Add accessibilityLabel to all interactive elements
    - Add accessibilityRole to buttons, inputs, etc.
    - Add accessibilityHint where helpful
    - _Requirements: 10.1, 10.5_

  - [ ] 12.2 Test with screen readers
    - Test VoiceOver on iOS
    - Test TalkBack on Android
    - Fix any navigation or labeling issues
    - _Requirements: 10.1_

  - [ ] 12.3 Verify color contrast
    - Check all text/background combinations
    - Ensure WCAG AA compliance (4.5:1 ratio)
    - Adjust colors if needed
    - _Requirements: 2.3, 10.3_

- [ ] 13. Performance optimization
  - [ ] 13.1 Optimize component renders
    - Add React.memo to expensive components
    - Use useCallback for event handlers
    - Use useMemo for computed values
    - _Requirements: 9.3_

  - [ ] 13.2 Optimize list rendering
    - Ensure FlatList is used for long lists
    - Add getItemLayout for fixed-height items
    - Add keyExtractor for stable keys
    - _Requirements: 9.1_

  - [ ] 13.3 Profile and fix performance issues
    - Use React DevTools Profiler
    - Identify slow renders
    - Fix any performance bottlenecks
    - _Requirements: 9.2, 9.5_

- [ ] 14. Final testing and documentation
  - [ ] 14.1 Test on physical devices
    - Test on iPhone (iOS 15+)
    - Test on Android phone (Android 11+)
    - Test different screen sizes
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ] 14.2 Update component documentation
    - Document all component props
    - Add usage examples
    - Document Tailwind class patterns
    - _Requirements: 8.5_

  - [ ] 14.3 Final visual review
    - Review all screens for consistency
    - Check spacing and alignment
    - Verify color usage
    - Fix any visual issues
    - _Requirements: 2.1, 3.5, 5.4_

- [ ] 15. Checkpoint - Final review
  - Ensure all tests pass
  - Verify app works on iOS and Android
  - Confirm all requirements are met
  - Ask the user if questions arise

## Notes

- Each task builds on previous tasks
- Test thoroughly after each major migration step
- Keep old components until new ones are fully tested
- Use feature flags if needed to toggle between old/new UI
- Document any issues or blockers encountered
- Take screenshots before/after for comparison
