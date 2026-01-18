# Stash App - Development TODO

## System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE APP LOGIC                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────────┐   │
│  │ Frontend │────▶│ Backend  │────▶│ Supabase │────▶│ Processing Layer │   │
│  │   App    │     │   API    │     │    DB    │     │  (ML/Extraction) │   │
│  └──────────┘     └──────────┘     └──────────┘     └──────────────────┘   │
│       ▲                                                      │              │
│       │                                                      ▼              │
│       │           ┌──────────────────────────────────────────┐              │
│       │           │            Response Flow                 │              │
│       │           └──────────────────────────────────────────┘              │
│       │                              │                                      │
│       │                              ▼                                      │
│       │           ┌──────────────────────────────────────────┐              │
│       │           │         Store in Supabase                │              │
│       │           └──────────────────────────────────────────┘              │
│       │                              │                                      │
│       │                              ▼                                      │
│  ┌────┴─────┐     ┌──────────────────────────────────────────┐              │
│  │  Async   │◀────│           LLM Layer (Automation)         │              │
│  │ Response │     │  • Generate instructions                 │              │
│  └──────────┘     │  • Return cached Supabase data           │              │
│       │           └──────────────────────────────────────────┘              │
│       ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Actions                                 │   │
│  │  • Update local storage/caching                                      │   │
│  │  • Alert user with smart suggestions                                 │   │
│  │  • Ask for approval on autonomous actions                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend / Processing

- [x] **Video/Link Processing Pipeline**
  - [x] Complete video URL extraction & transcription
  - [x] Metadata extraction (title, description, thumbnail)
  - [x] Connect processing pipeline with backend API

- [ ] **RAG AI Implementation**
  - [ ] Set up vector embeddings for memory retrieval
  - [ ] Implement RAG pipeline with Supabase pgvector
  - [ ] Prompt engineering for context-aware responses
  - [ ] Memory-augmented AI chat

- [ ] **API Endpoints**
  - [ ] Create CRUD endpoints for stash items
  - [ ] Create processing trigger endpoints
  - [ ] Create AI query endpoints
  - [ ] Create daily summary endpoint

---

## Authentication

- [ ] **Registration & Login** (likely done)
  - [ ] Auth registration endpoint
  - [ ] Login endpoint with JWT

- [ ] **Frontend-Backend Connection**
  - [ ] Set up environment secrets
  - [ ] Configure Supabase auth on frontend
  - [ ] Secure API routes with auth middleware

- [ ] **User Metadata**
  - [ ] POST endpoint for metadata during registration (name, age, preferences)
  - [ ] Store user context in database for personalization
  - [ ] *(Low Priority)* PATCH endpoint for editable profile fields

---

## Periodic Background Operations

### Every 5 Minutes
- [ ] **Frontend**: Implement async polling from backend
  - [ ] Background fetch for database updates
  - [ ] Silent notifications for new suggestions
- [ ] **Backend**: ML context updates
  - [ ] Check for pending processing tasks
  - [ ] Update embeddings if content changed

### Daily Summary (5:00 AM)
- [ ] **Backend**: Generate daily digest
  - [ ] Aggregate user activity
  - [ ] Run LLM to generate smart summary
  - [ ] Identify trending topics from saved content
- [ ] **Frontend**: Dashboard update
  - [ ] Async fetch of daily summary
  - [ ] Display AI-generated insights
  - [ ] Show smart suggestions based on patterns

---

## Features

### Memory Browser (App)
- [x] Frontend UI implementation (grid/list views)
- [x] Importance-based sorting
- [x] Type filtering (link, note, image, video)
- [ ] **Vector Embeddings**
  - [ ] Integrate Supabase pgvector
  - [ ] Implement semantic search endpoint
  - [ ] Connect frontend search to backend
- [ ] **Backend Connection**
  - [ ] Fetch real entries from database
  - [ ] Real-time updates via Supabase subscriptions

### Google Calendar Integration
- [ ] OAuth flow for Google Calendar
- [ ] Auto-detect events from saved content
- [ ] Create calendar events from AI suggestions
- [ ] Sync bidirectional (calendar → app reminders)

### Dashboard / Daily Summary (App)
- [x] UI implementation with mock data
- [x] Streak tracking
- [x] Weekly activity chart
- [x] AI insights section
- [x] Pending approvals for autonomous actions
- [ ] Connect to real backend data
- [ ] Implement approval/rejection flow

---

## Frontend Polish

- [x] Unified theme from tailwind.config.js
- [x] No hardcoded colors (all from theme)
- [x] Tab bar touch target fix
- [x] 5-tab navigation (Home, Memory, Add, Chat, Profile)
- [ ] Notification permission flow in onboarding
- [ ] Loading states & error handling
- [ ] Offline mode / caching strategy

---

## Priority Order

1. **Auth connection** - Frontend ↔ Backend with secrets
2. **Core data flow** - Save items → Process → Store → Retrieve
3. **RAG AI** - Vector embeddings + semantic search
4. **Background sync** - Polling + daily summary
5. **Google Calendar** - OAuth + event integration
