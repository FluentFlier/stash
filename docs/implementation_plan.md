# Stash - Implementation Plan
## AI Memory Assistant with Native Share Sheet Integration

> **Project:** Mobile app with iOS/Android share sheet integration + AI context assistant  
> **Tech Stack:** React Native (Expo) + Supabase + GPT-4 + Google Calendar  
> **Timeline:** Phased development approach

---

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Implementation Phases](#implementation-phases)
6. [API Specifications](#api-specifications)
7. [Verification Plan](#verification-plan)

---

## Problem Statement

**Information overload without organization:**
- Users save 50+ items per week (articles, screenshots, notes, videos)
- Content scattered across apps (Notes, Photos, Safari Reading List, Pocket)
- No context, no organization, no memory
- Existing solutions require manual organization or lack AI understanding

**Current pain points:**
- Can't remember what was saved last week
- No way to query saved content conversationally
- Manual calendar entry for events
- No proactive reminders based on context

---

## Solution Overview

### Stash: Your AI Memory Assistant

**Core Features:**
1. **Native Share Sheet Integration** - Capture from ANY app via iOS/Android share menu
2. **AI Context Extraction** - GPT-4V analyzes content for entities, dates, intent, actions
3. **Conversational Interface** - Chat with your memory like ChatGPT
4. **Autonomous Agent** - Proactive reminders, morning briefings, smart suggestions
5. **Google Calendar Integration** - Auto-create events from captured content

**Key Differentiators:**
- ✅ OS-level integration (share sheet) - already in user workflow
- ✅ Persistent memory across all conversations
- ✅ Proactive, not just reactive
- ✅ Clean, modern, minimalistic UI

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ANY iOS/ANDROID APP                       │
│         (Safari, Twitter, Notes, Photos, etc.)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    [User taps Share]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  NATIVE SHARE SHEET                          │
│              [Stash appears as option]                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              STASH APP (expo-share-intent)                   │
│    Receives: text, URLs, images, videos                     │
│    → Opens "Add Context" tab with pre-filled data           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  UPLOAD TO SUPABASE                          │
│    Images: Supabase Storage                                 │
│    Videos: Temporary upload for processing                  │
│    Links: Metadata extraction                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND PROCESSING (Supabase Edge Functions)   │
│    GPT-4V: Extract metadata, entities, intent               │
│    → Date/time extraction                                   │
│    → Entity recognition (people, places, events)            │
│    → Intent classification (save, remind, schedule)         │
│    → Suggested actions                                      │
│    → Store in Postgres with embeddings                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  STASH MOBILE APP                            │
│                                                              │
│  Tab 1: CHAT              Tab 2: ADD CONTEXT                 │
│  - Conversational UI      - Manual capture                   │
│  - Query saved content    - Image/video/link                 │
│  - AI responses           - Share intent target              │
│                                                              │
│  Tab 3: PROFILE                                              │
│  - User metadata                                             │
│  - Settings                                                  │
│  - Google Calendar status                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  INTEGRATIONS                                │
│    Google Calendar | Push Notifications | Autonomous Agent  │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Mobile App)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React Native (Expo) | Cross-platform mobile development |
| **Language** | TypeScript | Type safety and better DX |
| **Navigation** | React Navigation v6 | Tab navigation + stack navigation |
| **State Management** | Zustand | Lightweight, simple global state |
| **UI Components** | Custom (design system) | Clean, minimalistic, vibrant UI |
| **Icons** | Lucide React Native | Consistent icon system (no emojis) |
| **Share Extension** | expo-share-intent | Native share sheet integration |
| **Image Picker** | expo-image-picker | Camera and gallery access |
| **Camera** | expo-camera | Video recording |
| **Notifications** | expo-notifications | Push notifications |
| **Auth** | Supabase Auth | User authentication |

### Backend (Cloud)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | Supabase (Postgres) | Structured data storage |
| **Storage** | Supabase Storage | Media files (images, videos) |
| **Auth** | Supabase Auth | User management, JWT tokens |
| **Real-time** | Supabase Realtime | Live updates (optional) |
| **Functions** | Supabase Edge Functions | Serverless processing |
| **AI Processing** | GPT-4 + GPT-4V (OpenAI) | Context extraction, chat responses |
| **Embeddings** | OpenAI Embeddings | Semantic search |
| **Calendar** | Google Calendar API | Event management |
| **Notifications** | Expo Push Notifications | Autonomous reminders |

### Key Technical Decisions

**Why Supabase over MongoDB?**
- ✅ Built-in auth, storage, and real-time in one service
- ✅ Postgres = better for structured data + relationships
- ✅ Row-level security (RLS) for data privacy
- ✅ Simpler integration with fewer services
- ✅ Free tier generous for MVP

**Why expo-share-intent?**
- ✅ Handles both iOS and Android share extensions
- ✅ Supports text, URLs, images, videos, files
- ✅ Works with Expo managed workflow
- ✅ Active maintenance (updated 2025-2026)

**Why Zustand over Redux?**
- ✅ Simpler API, less boilerplate
- ✅ TypeScript-first
- ✅ No providers needed
- ✅ Perfect for small-to-medium apps

---

## Implementation Phases

### Phase 1: Project Setup & Design System (4-6 hours)

**Frontend:**
- [ ] Initialize Expo React Native project with TypeScript
- [ ] Set up project structure (screens, components, theme, store)
- [ ] Install dependencies (React Navigation, Zustand, Lucide icons)
- [ ] Implement design system (colors, typography, spacing, shadows)
- [ ] Build core components (Button, Input, Card, Avatar, MessageBubble)
- [ ] Set up navigation structure (Stack + Tab navigators)

**Backend:**
- [ ] Create Supabase project
- [ ] Set up Postgres database schema
- [ ] Configure Supabase Storage buckets
- [ ] Set up Row-Level Security (RLS) policies
- [ ] Initialize Supabase Edge Functions project

**Deliverables:**
- Working Expo app with navigation
- Design system implemented
- Supabase project configured

---

### Phase 2: Authentication & Onboarding (4-6 hours)

**Frontend:**
- [ ] Build Landing page
- [ ] Build Login/Signup screens
- [ ] Implement auth state management (Zustand)
- [ ] Build Onboarding flow (3 steps)
  - Welcome screen
  - Google Calendar connection (UI only, pending integration)
  - User metadata collection (name, role, age)
- [ ] Integrate Supabase Auth SDK

**Backend:**
- [ ] Set up Supabase Auth (email/password)
- [ ] Create `user_profiles` table for metadata
- [ ] Create API endpoint for onboarding data
- [ ] Implement user profile CRUD operations

**Deliverables:**
- Complete auth flow (dummy for now)
- Onboarding screens functional
- User metadata stored in Supabase

---

### Phase 3: Chat Interface (6-8 hours)

**Frontend:**
- [ ] Build Chat tab UI
- [ ] Implement message list (scrollable, auto-scroll)
- [ ] Build message input with send button
- [ ] Create MessageBubble component (user/AI/system)
- [ ] Implement typing indicator
- [ ] Add loading states
- [ ] Implement chat state management (Zustand)

**Backend:**
- [ ] Create `conversations` table
- [ ] Create `messages` table
- [ ] Implement chat API endpoint (POST /api/chat/message)
- [ ] Integrate GPT-4 for responses
- [ ] Implement conversation history retrieval
- [ ] Add context injection (retrieve relevant saved content)

**Deliverables:**
- Functional chat interface
- AI responses working
- Conversation history persisted

---

### Phase 4: Add Context Tab & Share Intent (8-10 hours)

**Frontend:**
- [ ] Build Add Context tab UI
- [ ] Implement image picker (camera + gallery)
- [ ] Implement video picker (camera + gallery)
- [ ] Implement link input
- [ ] Build preview components
- [ ] Add caption/notes input
- [ ] Implement "Process" button with loading state
- [ ] Integrate expo-share-intent
- [ ] Handle share intent data (pre-fill Add Context tab)

**Backend:**
- [ ] Create `context_items` table
- [ ] Implement image upload to Supabase Storage
- [ ] Implement video upload (temporary)
- [ ] Create processing Edge Function
  - GPT-4V for image analysis
  - Video frame extraction + analysis
  - Link metadata extraction
- [ ] Store extracted data in Postgres
- [ ] Delete video after processing (keep extracted data only)

**Deliverables:**
- Add Context tab functional
- Share sheet integration working
- Content processing pipeline complete

---

### Phase 5: Profile & Settings (2-4 hours)

**Frontend:**
- [ ] Build Profile tab UI
- [ ] Display user metadata
- [ ] Implement edit mode for metadata fields
- [ ] Show Google Calendar connection status
- [ ] Add notification settings toggle
- [ ] Implement sign out functionality

**Backend:**
- [ ] Create profile update API endpoint
- [ ] Implement metadata validation
- [ ] Add Google Calendar connection status check

**Deliverables:**
- Profile page complete
- User can edit metadata
- Settings functional

---

### Phase 6: Google Calendar Integration (4-6 hours)

**Frontend:**
- [ ] Build Google Calendar OAuth flow UI
- [ ] Add "Connect Calendar" button in onboarding
- [ ] Add calendar connection status in profile
- [ ] Handle OAuth callback

**Backend:**
- [ ] Set up Google Calendar API credentials
- [ ] Implement OAuth flow (authorization + token exchange)
- [ ] Store calendar tokens securely in Supabase
- [ ] Create API endpoint to create calendar events
- [ ] Implement event creation from extracted data

**Deliverables:**
- Google Calendar connection working
- Events auto-created from captured content

---

### Phase 7: Autonomous Agent Features (6-8 hours)

**Backend:**
- [ ] Set up cron job scheduler (Supabase Edge Functions + pg_cron)
- [ ] Implement morning briefing generator
  - Query recent captures
  - Analyze with GPT-4
  - Generate personalized summary
- [ ] Implement event-based reminders
  - Check for upcoming events (30 min before)
  - Find related captures
  - Send push notification
- [ ] Implement smart suggestions (weekly)
  - Analyze capture patterns
  - Generate insights with GPT-4
  - Send notification
- [ ] Integrate Expo Push Notifications

**Frontend:**
- [ ] Handle push notification permissions
- [ ] Implement notification tap handlers
- [ ] Add notification settings in profile

**Deliverables:**
- Morning briefings working
- Event reminders functional
- Smart suggestions implemented

---

### Phase 8: Polish & Testing (4-6 hours)

**Frontend:**
- [ ] Add animations and transitions
- [ ] Implement error handling (network errors, API errors)
- [ ] Add empty states
- [ ] Optimize performance (lazy loading, memoization)
- [ ] Test on physical devices (iOS + Android)
- [ ] Fix UI bugs and edge cases

**Backend:**
- [ ] Add error handling and logging
- [ ] Optimize database queries
- [ ] Add rate limiting
- [ ] Test all API endpoints
- [ ] Monitor performance

**Deliverables:**
- Polished, production-ready app
- All edge cases handled
- Performance optimized

---

## API Specifications

### Authentication

```typescript
// POST /api/auth/signup
Request: {
  email: string;
  password: string;
}
Response: {
  user: {
    id: string;
    email: string;
  };
  token: string;
}

// POST /api/auth/signin
Request: {
  email: string;
  password: string;
}
Response: {
  user: User;
  token: string;
}

// POST /api/auth/signout
Request: {
  token: string;
}
Response: {
  success: boolean;
}
```

### User Profile

```typescript
// GET /api/user/profile
Headers: { Authorization: Bearer <token> }
Response: {
  id: string;
  email: string;
  name: string;
  role: string;
  age: number;
  googleCalendarConnected: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
}

// PUT /api/user/profile
Request: {
  name?: string;
  role?: string;
  age?: number;
}
Response: {
  user: User;
}

// POST /api/user/onboarding
Request: {
  name: string;
  role: string;
  age: number;
}
Response: {
  user: User;
}
```

### Chat

```typescript
// POST /api/chat/message
Request: {
  message: string;
  conversationId?: string;
}
Response: {
  response: string;
  conversationId: string;
  messageId: string;
  timestamp: string;
  relatedContent?: Array<{
    id: string;
    type: 'image' | 'video' | 'link' | 'text';
    preview: string;
    relevance: number;
  }>;
}

// GET /api/chat/history
Query: { conversationId?: string }
Response: {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  conversationId: string;
}
```

### Context Processing

```typescript
// POST /api/context/add
Request: {
  type: 'image' | 'video' | 'link';
  content: string; // base64 for images, URL for videos/links
  caption?: string;
}
Response: {
  id: string;
  status: 'processing' | 'ready' | 'failed';
  extractedData?: {
    text?: string;
    entities?: string[];
    suggestedActions?: Array<{
      type: 'calendar' | 'reminder' | 'tag';
      data: any;
    }>;
  };
}

// GET /api/context/items
Query: { limit?: number; offset?: number }
Response: {
  items: Array<ContextItem>;
  total: number;
}

// GET /api/context/:id
Response: {
  item: ContextItem;
}
```

### Google Calendar

```typescript
// POST /api/calendar/connect
Request: {
  authorizationCode: string;
}
Response: {
  success: boolean;
  calendarConnected: boolean;
}

// POST /api/calendar/create-event
Request: {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}
Response: {
  eventId: string;
  eventUrl: string;
}
```

### Autonomous Systems

```typescript
// GET /api/autonomous/briefing
Response: {
  summary: string;
  relatedItems: Array<{
    id: string;
    type: string;
    preview: string;
  }>;
  generatedAt: string;
}

// GET /api/autonomous/reminders
Response: {
  reminders: Array<{
    id: string;
    type: 'event' | 'deadline' | 'suggestion';
    title: string;
    description: string;
    triggerTime: string;
    relatedItems: string[];
  }>;
}
```

---

## Database Schema

### Supabase Postgres Tables

```sql
-- Users table (managed by Supabase Auth)
-- Extended with user_profiles table

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role TEXT,
  age INTEGER,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  google_calendar_token TEXT,
  google_calendar_refresh_token TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context items table
CREATE TABLE context_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL, -- 'image', 'video', 'link', 'text'
  source_url TEXT, -- Supabase Storage URL for images
  extracted_text TEXT,
  entities JSONB, -- Array of extracted entities
  metadata JSONB, -- Additional metadata
  suggested_actions JSONB, -- Array of suggested actions
  embedding VECTOR(1536), -- For semantic search
  status TEXT DEFAULT 'processing', -- 'processing', 'ready', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_context_items_user ON context_items(user_id);
CREATE INDEX idx_context_items_created ON context_items(created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);

-- Row-Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own context items"
  ON context_items FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Verification Plan

### Automated Tests

**Frontend (Jest + React Native Testing Library):**
```bash
npm test
```
- Component rendering tests
- Navigation flow tests
- State management tests
- API integration tests (mocked)

**Backend (Supabase Edge Functions):**
- Unit tests for processing functions
- Integration tests for API endpoints
- Database query tests

### Manual Testing

**Authentication Flow:**
1. Landing page → Sign Up
2. Enter email/password → Create account
3. Onboarding flow (3 steps)
4. Complete setup → Navigate to Chat tab

**Chat Functionality:**
1. Send message → Verify AI response
2. Ask about saved content → Verify retrieval
3. Check conversation history → Verify persistence

**Add Context:**
1. Tap "Add Image" → Select from gallery
2. Add caption → Tap "Process"
3. Verify processing status → Check extracted data
4. Repeat for video and link

**Share Intent:**
1. Open Safari → Share article
2. Select Stash from share sheet
3. Verify app opens with pre-filled data
4. Tap "Process" → Verify content saved

**Profile:**
1. View profile → Check metadata display
2. Edit name/role/age → Save changes
3. Check Google Calendar status
4. Toggle notifications → Verify saved

### Performance Benchmarks

| Operation | Target | Acceptable |
|-----------|--------|------------|
| App launch | < 2s | < 3s |
| Chat message response | < 3s | < 5s |
| Image upload | < 2s | < 4s |
| Image processing | < 5s | < 10s |
| Video processing | < 15s | < 30s |
| Navigation transition | < 300ms | < 500ms |

---

## Success Criteria

### Minimum Viable Product (MVP)

- ✅ User can sign up and log in
- ✅ Onboarding flow complete (with dummy Google Calendar)
- ✅ Chat interface functional with AI responses
- ✅ Can add images/videos/links manually
- ✅ Share sheet integration working
- ✅ Content processing pipeline complete
- ✅ Profile page functional

### Stretch Goals

- ✅ Google Calendar integration live
- ✅ Morning briefings working
- ✅ Event-based reminders functional
- ✅ Smart suggestions implemented
- ✅ Semantic search working
- ✅ Animations and polish complete

---

## Next Steps

1. **Set up development environment**
   - Initialize Expo project
   - Create Supabase project
   - Set up environment variables

2. **Begin Phase 1: Project Setup**
   - Implement design system
   - Build core components
   - Set up navigation

3. **Proceed through phases sequentially**
   - Complete each phase before moving to next
   - Test thoroughly at each stage
   - Document any blockers or changes

---

**Ready to build! 🚀**
