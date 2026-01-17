# Stash - Architecture Overview
## Native Share Sheet Integration + AI Context Assistant

> **Vision:** Universal capture via iOS Share Sheet → AI-powered context extraction → Conversational assistant with your entire memory

---

## 🎯 Core Concept

**The Problem:**
- You save 50+ things per week (links, screenshots, notes)
- They get lost across apps (Notes, Photos, Safari Reading List)
- No context, no organization, no memory

**The Solution:**
- **Share anything** from any app → Stash via native Share Sheet
- **AI extracts context** - dates, entities, intent, relevance
- **Chat with your memory** - "What was that article about internships?"
- **Autonomous agent** - Suggests reminders, calendar events, follow-ups

---

## 🏗️ System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ANY iOS APP                               │
│         (Safari, Twitter, Notes, Photos, etc.)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    [User taps Share]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  iOS SHARE SHEET                             │
│              [Stash appears as option]                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              STASH SHARE EXTENSION                           │
│    Receives: text, URLs, images, videos, files              │
│    → Uploads to Supabase Storage                            │
│    → Creates record in Postgres                             │
│    → Opens main app (deep link)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND PROCESSING                          │
│    GPT-4V: Extract metadata, entities, intent               │
│    → Date/time extraction                                   │
│    → Entity recognition (people, places, events)            │
│    → Intent classification (save, remind, schedule)         │
│    → Relevance scoring                                      │
│    → Store in Supabase with embeddings                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  STASH MOBILE APP                            │
│                                                              │
│  Tab 1: STORE/INBOX          Tab 2: CHAT/ASSISTANT          │
│  - All saved items           - Conversational interface     │
│  - Smart grouping            - Ask about saved content      │
│  - Quick actions             - Request actions              │
│                              - Autonomous suggestions        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  INTEGRATIONS                                │
│    Google Calendar | Push Notifications | Reminders         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile App Structure

### Tab 1: Store / Inbox

**Purpose:** Display all saved content with smart organization

**Features:**
- Timeline view of all shared items
- Smart grouping (by date, topic, intent)
- Rich previews (link cards, image thumbnails, video previews)
- Quick actions (add to calendar, set reminder, archive)
- Search and filter
- Swipe gestures (archive, delete, share)

**Data Display:**
```
┌─────────────────────────────────────────┐
│  Today                                  │
├─────────────────────────────────────────┤
│  📄 Article: "Best Internship Tips"    │
│     Saved from Safari • 2 hours ago     │
│     💡 Suggested: Add to reading list   │
├─────────────────────────────────────────┤
│  📸 Screenshot: Meeting notes           │
│     Saved from Photos • 5 hours ago     │
│     📅 Event detected: Team sync 2pm    │
│     💡 Suggested: Add to calendar       │
├─────────────────────────────────────────┤
│  🔗 Link: Recipe for pasta              │
│     Saved from Messages • 8 hours ago   │
│     💡 Suggested: Create shopping list  │
└─────────────────────────────────────────┘
```

### Tab 2: Chat / Assistant

**Purpose:** Conversational interface to interact with stored context

**Features:**
- Natural language queries
- Context-aware responses (uses all saved content)
- Action execution (calendar, reminders, sharing)
- Autonomous suggestions
- Voice input support

**Example Interactions:**
```
User: "What was that article I saved about internships?"
AI: "You saved 'Best Internship Tips' from TechCrunch 
     2 hours ago. It covers resume tips, networking, 
     and interview prep. Want me to summarize it?"

User: "Remind me about this event tomorrow"
AI: "I found a team sync meeting at 2pm in your 
     screenshot from today. I'll remind you 30 minutes 
     before. Should I add it to your calendar too?"

User: "Add this to my calendar"
AI: "Added 'Team Sync Meeting' to Google Calendar
     for tomorrow at 2pm. I've set a 30-minute reminder."
```

**Autonomous Suggestions:**
```
💡 "You've saved 3 recipes this week but haven't 
    cooked any. Want me to create a shopping list?"

💡 "Your meeting with Sarah is in 30 minutes. 
    Here are the notes you saved yesterday."

💡 "You saved this article about internships 3 days 
    ago but haven't read it. Should I archive it?"
```

---

## 🔧 Technology Stack

### Frontend (Mobile App)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React Native (Expo) | Cross-platform mobile |
| Share Extension | expo-share-intent | Native share sheet integration |
| Navigation | React Navigation | Tab navigation + deep linking |
| State Management | Zustand | Global state |
| UI Components | React Native Paper | Material Design components |
| Auth | Supabase Auth | User authentication |
| Real-time | Supabase Realtime | Live updates |

### Backend (Cloud)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Database | Supabase (Postgres) | Structured data storage |
| Storage | Supabase Storage | Media files (images, videos) |
| Auth | Supabase Auth | User management |
| Real-time | Supabase Realtime | Live sync |
| Functions | Supabase Edge Functions | Serverless processing |
| AI Processing | GPT-4 + GPT-4V | Context extraction, chat |
| Embeddings | OpenAI Embeddings | Semantic search |
| Calendar | Google Calendar API | Event management |
| Notifications | Expo Notifications | Push notifications |

### Key Technical Decisions

**Why Supabase over MongoDB?**
- ✅ Built-in auth, storage, and real-time
- ✅ Postgres = better for structured data + relationships
- ✅ Row-level security (RLS) for data privacy
- ✅ Simpler integration with fewer services
- ✅ Free tier generous for hackathon

**Why expo-share-intent?**
- ✅ Handles both iOS and Android share extensions
- ✅ Supports text, URLs, images, videos, files
- ✅ Works with Expo managed workflow
- ✅ Active maintenance (updated 2025-2026)

**Why Google Calendar integration required?**
- ✅ Most common calendar for target users
- ✅ Enables autonomous event creation
- ✅ Syncs across devices automatically

---

## 🔄 Share Sheet Implementation

### How It Works

**1. User shares content from any app**
```
Safari → Share button → Stash appears in share sheet
```

**2. Share extension receives content**
```typescript
// Handled by expo-share-intent
const { type, url, text, files } = shareIntent;
```

**3. Upload to Supabase**
```typescript
// Upload media files to Supabase Storage
if (files && files.length > 0) {
  const { data, error } = await supabase.storage
    .from('captures')
    .upload(`${userId}/${captureId}/${filename}`, file);
}

// Create database record
await supabase.from('captures').insert({
  user_id: userId,
  type: 'image', // or 'video', 'link', 'text'
  url: storageUrl,
  raw_text: text,
  status: 'processing',
  created_at: new Date(),
});
```

**4. Trigger backend processing**
```typescript
// Supabase Edge Function triggered on insert
// Extracts metadata using GPT-4V
const analysis = await openai.chat.completions.create({
  model: 'gpt-4-vision-preview',
  messages: [
    {
      role: 'system',
      content: `Extract metadata from this content:
- Date/time references
- People, places, events
- Intent (save, remind, schedule, research)
- Entities (companies, products, topics)
- Suggested actions

Format as JSON.`
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: rawText },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }
  ]
});

// Update database with extracted metadata
await supabase.from('captures').update({
  metadata: analysis,
  entities: extractedEntities,
  suggested_actions: suggestedActions,
  status: 'ready',
}).eq('id', captureId);
```

**5. Deep link to main app**
```typescript
// Share extension opens main app
Linking.openURL('stash://capture/' + captureId);
```

**6. User sees processed content**
```
Store tab shows new item with:
- Rich preview
- Extracted metadata
- Suggested actions
```

---

## 🤖 Autonomous Agent Features

### Morning Briefing (8am daily)
```
☀️ Good morning! Here's what's important today:

📅 Meeting at 2pm - Review notes from yesterday
📝 Deadline tomorrow - Finish project proposal
💡 You saved 3 recipes this week - want a shopping list?
```

### Event-Based Reminders
```
🔔 Meeting in 30 minutes: Product Roadmap

📸 Related content:
- Whiteboard notes (yesterday)
- Competitor analysis (2 days ago)
- Budget spreadsheet (3 days ago)
```

### Smart Suggestions
```
💡 Pattern detected: You've saved 5 articles about 
    React Native this week. Want me to create a 
    learning plan?
```

---

## 📊 Data Model (Supabase Schema)

### captures table
```sql
CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL, -- 'text', 'link', 'image', 'video', 'file'
  url TEXT, -- Supabase Storage URL for media
  raw_text TEXT, -- Original text content
  metadata JSONB, -- Extracted by GPT-4
  entities JSONB, -- People, places, events, topics
  suggested_actions JSONB, -- Calendar, reminders, etc.
  embedding VECTOR(1536), -- For semantic search
  status TEXT DEFAULT 'processing', -- 'processing', 'ready', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_captures_user ON captures(user_id);
CREATE INDEX idx_captures_created ON captures(created_at DESC);
CREATE INDEX idx_captures_embedding ON captures USING ivfflat (embedding vector_cosine_ops);
```

### user_preferences table
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  google_calendar_token TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  morning_briefing_time TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Security & Privacy

**Row-Level Security (RLS):**
```sql
-- Users can only see their own captures
CREATE POLICY "Users can view own captures"
  ON captures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own captures"
  ON captures FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Data Privacy:**
- All user data encrypted at rest (Supabase default)
- Share extension uses secure storage
- No data shared between users
- User can delete all data anytime

---

## 📈 Success Metrics

**MVP (Hour 18):**
- ✅ Share sheet integration working
- ✅ Content appears in Store tab
- ✅ Basic chat queries work
- ✅ Google Calendar connected

**Stretch Goals (Hour 24):**
- ✅ Image/video processing with GPT-4V
- ✅ Autonomous morning briefings
- ✅ Smart action suggestions
- ✅ Semantic search working

---

## 🎬 Demo Flow

**1. Share from Safari (0:30)**
- Open article in Safari
- Tap Share → Stash
- Content captured, app opens
- Show processing → metadata extracted

**2. Store Tab (1:00)**
- View saved article with rich preview
- Show extracted metadata (date, entities)
- Tap suggested action "Add to reading list"

**3. Chat Interaction (1:30)**
- Ask: "What was that article about internships?"
- AI retrieves and summarizes
- Ask: "Remind me to read this tomorrow"
- AI confirms reminder set

**4. Autonomous Features (1:00)**
- Show morning briefing notification
- Demonstrate event reminder before meeting
- Show smart suggestion based on patterns

**Total: 4 minutes**

---

**Next Step:** Define detailed frontend app spec (UI system, colors, components, responsibilities)

Ready when you are! 🚀
