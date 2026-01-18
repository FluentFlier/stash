# UI Preview - Stash Redesign

## Color Palette

### Primary Colors
```
Primary 500: #7c6ff0 (Vibrant Purple) - Main brand color
Primary 600: #6d4ee3 (Darker Purple) - Hover states
Primary 400: #8b93f8 (Lighter Purple) - Accents

Accent 500: #06b6d4 (Teal) - Secondary actions
Accent 600: #0891b2 (Darker Teal) - Hover states
Accent 400: #22d3ee (Lighter Teal) - Highlights
```

### Background Colors (Dark Mode)
```
Background: #0a0a0a (Near Black) - Main background
Surface: #171717 (Dark Gray) - Cards and elevated surfaces
Surface Elevated: #262626 (Medium Gray) - Inputs and interactive elements
Border: #404040 (Light Gray) - Borders and dividers
```

### Text Colors
```
Primary: #fafafa (Almost White) - Main text
Secondary: #d4d4d4 (Light Gray) - Secondary text
Tertiary: #a3a3a3 (Medium Gray) - Hints and captions
```

### Semantic Colors
```
Success: #10b981 (Green) - Success states
Warning: #f59e0b (Orange) - Warning states
Error: #ef4444 (Red) - Error states
Info: #3b82f6 (Blue) - Info states
```

## Component Examples

### Button Variants

**Primary Button**
```tsx
<Button variant="primary" size="lg">
  Send Message
</Button>
```
- Background: Linear gradient (primary-600 → primary-500 → accent-500)
- Text: White
- Shadow: Glow effect with primary color
- Press: Scale down to 0.96, haptic feedback

**Secondary Button**
```tsx
<Button variant="secondary" size="md">
  Cancel
</Button>
```
- Background: Surface elevated (#262626)
- Text: Primary text color
- Border: 1px solid border color
- Press: Slight opacity change

**Outline Button**
```tsx
<Button variant="outline" size="md">
  Learn More
</Button>
```
- Background: Transparent
- Text: Primary color
- Border: 2px solid primary color
- Press: Background fills with primary/10

**Ghost Button**
```tsx
<Button variant="ghost" size="sm">
  Skip
</Button>
```
- Background: Transparent
- Text: Primary color
- No border
- Press: Background fills with neutral/10

### Card Variants

**Default Card**
```tsx
<Card variant="default">
  <Card.Content>
    <Text>Content here</Text>
  </Card.Content>
</Card>
```
- Background: Surface (#171717)
- Border: 1px solid border color
- Border radius: 16px
- Padding: 16px

**Elevated Card**
```tsx
<Card variant="elevated">
  <Card.Content>
    <Text>Content here</Text>
  </Card.Content>
</Card>
```
- Background: Surface (#171717)
- Shadow: Medium shadow (0 4px 6px rgba(0,0,0,0.1))
- Border radius: 16px
- No border

**Glass Card**
```tsx
<Card variant="glass">
  <Card.Content>
    <Text>Content here</Text>
  </Card.Content>
</Card>
```
- Background: Semi-transparent with blur
- Border: 1px solid white/10
- Border radius: 16px
- Backdrop blur effect

### Input Component

```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  leftIcon={<Mail size={20} />}
/>
```
- Background: Surface elevated (#262626)
- Border: 1px solid border color
- Border radius: 12px
- Focus: Border changes to primary color
- Error: Border changes to error color, shows error message below

### Message Bubbles

**User Message**
```tsx
<MessageBubble role="user" content="Hello!" timestamp="2:30 PM" />
```
- Background: Primary gradient
- Text: White
- Alignment: Right
- Border radius: 20px (rounded on left, sharp on bottom-right)
- Max width: 80%

**Assistant Message**
```tsx
<MessageBubble role="assistant" content="Hi there!" timestamp="2:30 PM" />
```
- Background: Surface elevated (#262626)
- Text: Primary text color
- Alignment: Left
- Border radius: 20px (rounded on right, sharp on bottom-left)
- Max width: 80%

**System Message**
```tsx
<MessageBubble role="system" content="Chat started" />
```
- Background: Transparent
- Text: Tertiary text color
- Alignment: Center
- Font size: Small
- No timestamp

### Avatar Component

```tsx
<Avatar size="lg" fallback="JD" />
```
- Size sm: 32x32px
- Size md: 48x48px
- Size lg: 64x64px
- Background: Primary gradient
- Text: White, centered
- Border radius: Full circle
- Border: 2px solid surface

## Screen Layouts

### Chat Screen

```
┌─────────────────────────────────────────┐
│  [Avatar] Your AI Assistant    [Icon]   │ ← Header (dark bg, border bottom)
│           Online •                       │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ ⚡ Daily Summary                  │  │ ← Glass card
│  │ You've saved 12 items this week   │  │
│  │ [+24%] [2h saved]                 │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌─────────────────────────────────┐    │ ← Assistant message
│  │ Hi! I'm your AI assistant...    │    │   (left aligned, gray bg)
│  │                          2:30 PM │    │
│  └─────────────────────────────────┘    │
│                                          │
│      ┌─────────────────────────────┐    │ ← User message
│      │ What did I save yesterday?  │    │   (right aligned, purple gradient)
│      │ 2:31 PM                     │    │
│      └─────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │ ← Assistant message
│  │ You saved 3 items yesterday...  │    │
│  │                          2:31 PM │    │
│  └─────────────────────────────────┘    │
│                                          │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────┐  [→]   │ ← Input area
│  │ Ask me anything...          │        │   (elevated bg, rounded)
│  └─────────────────────────────┘        │
└─────────────────────────────────────────┘
```

### Add Context Screen

```
┌─────────────────────────────────────────┐
│  Add to Stash                    [📤]   │ ← Header
│  Capture anything, remember everything  │
├─────────────────────────────────────────┤
│                                          │
│  What do you want to save?              │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐│ ← Type selection grid
│  │  📷  │  │  🎥  │  │  🔗  │  │  📝  ││   (cards with icons)
│  │Photo │  │Video │  │ Link │  │ Note ││
│  └──────┘  └──────┘  └──────┘  └──────┘│
│                                          │
│  ┌───────────────────────────────────┐  │ ← Input card (glass)
│  │ URL                               │  │
│  │ ┌───────────────────────────────┐ │  │
│  │ │ 🔗 https://example.com        │ │  │
│  │ └───────────────────────────────┘ │  │
│  │                                   │  │
│  │ [      Save Link      ]           │  │ ← Primary button
│  └───────────────────────────────────┘  │
│                                          │
│  Recent Captures                         │
│                                          │
│  ┌───────────────────────────────────┐  │ ← Recent item card
│  │ [📷] Meeting notes        ✓       │  │   (elevated)
│  │      2h ago                       │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │ [🔗] Article about AI     ✓       │  │
│  │      5h ago                       │  │
│  └───────────────────────────────────┘  │
│                                          │
└─────────────────────────────────────────┘
```

### Profile Screen

```
┌─────────────────────────────────────────┐
│  Profile                                 │ ← Header
├─────────────────────────────────────────┤
│                                          │
│         ┌──────────┐                     │ ← Avatar (large)
│         │    JD    │                     │   (gradient bg)
│         └──────────┘                     │
│                                          │
│         John Doe                         │ ← Name (large text)
│         john@example.com                 │ ← Email (secondary text)
│                                          │
│  ┌───────────────────────────────────┐  │ ← Info card (elevated)
│  │ Account Information               │  │
│  │                                   │  │
│  │ Name          John Doe            │  │
│  │ Role          Developer           │  │
│  │ Age           28                  │  │
│  │                                   │  │
│  │ [Edit Profile]                    │  │ ← Secondary button
│  └───────────────────────────────────┘  │
│                                          │
│  ┌───────────────────────────────────┐  │ ← Settings card
│  │ Settings                          │  │
│  │                                   │  │
│  │ Google Calendar    [Connected ✓]  │  │
│  │ Notifications      [Toggle On]    │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                          │
│  [Sign Out]                              │ ← Destructive button
│                                          │
└─────────────────────────────────────────┘
```

## Typography Scale

```
Display (36px/40px) - Screen titles
Heading 1 (30px/36px) - Major sections
Heading 2 (24px/32px) - Card titles
Heading 3 (20px/28px) - Subsections
Heading 4 (18px/28px) - Small headings
Body Large (18px/28px) - Emphasized body text
Body (16px/24px) - Default body text
Body Medium (16px/24px, weight 500) - Medium emphasis
Label Large (14px/20px, weight 600) - Large labels
Label (14px/20px) - Default labels
Caption (12px/16px) - Small text, hints
```

## Spacing System

```
0.5 (2px) - Tiny gaps
1 (4px) - Very small gaps
2 (8px) - Small gaps
3 (12px) - Default gaps
4 (16px) - Medium gaps
5 (20px) - Large gaps
6 (24px) - Extra large gaps
8 (32px) - Section spacing
10 (40px) - Major section spacing
```

## Border Radius

```
sm (4px) - Subtle rounding
default (8px) - Standard rounding
md (12px) - Medium rounding
lg (16px) - Large rounding (cards)
xl (20px) - Extra large (buttons, inputs)
2xl (24px) - Very large
full (9999px) - Circular (avatars, badges)
```

## Animations

### Button Press
- Scale: 1.0 → 0.96
- Duration: 100ms
- Easing: Spring (friction: 3, tension: 40)
- Haptic: Light impact

### Screen Transition
- Type: Slide from right (iOS) / Fade (Android)
- Duration: 300ms
- Easing: Ease-in-out

### Loading Spinner
- Type: Circular
- Color: Primary 500
- Size: 24px (small), 32px (medium), 48px (large)

### Success Feedback
- Type: Scale + Fade
- Scale: 0.8 → 1.0
- Opacity: 0 → 1
- Duration: 200ms
- Haptic: Success notification

### Error Shake
- Type: Horizontal shake
- Distance: ±10px
- Iterations: 3
- Duration: 400ms
- Haptic: Error notification

## Comparison: Before vs After

### Before (Current)
- ❌ Inconsistent color usage
- ❌ StyleSheet.create() everywhere
- ❌ Hard to maintain theme
- ❌ Verbose styling code
- ❌ No design system
- ❌ Inconsistent spacing
- ❌ Poor color contrast in places

### After (NativeWind)
- ✅ Cohesive color palette
- ✅ Tailwind utility classes
- ✅ Centralized theme config
- ✅ Concise, readable styles
- ✅ Complete design system
- ✅ Consistent spacing scale
- ✅ WCAG AA compliant colors

## Example Code Comparison

### Before
```tsx
const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
});

<Pressable style={styles.button}>
  <Text style={styles.buttonText}>Click Me</Text>
</Pressable>
```

### After
```tsx
<Pressable className="bg-gradient-to-r from-primary-600 to-accent-500 px-6 py-3 rounded-xl items-center justify-center">
  <Text className="text-white text-base font-semibold">Click Me</Text>
</Pressable>
```

Much cleaner and more maintainable! 🎉
