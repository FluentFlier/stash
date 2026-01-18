# Stash Backend - Autonomous AI System 🤖

An **agentic AI backend** that doesn't just store content—it **thinks, decides, and acts** autonomously.

## What Makes This "Agentic"?

This isn't a typical CRUD API. When you save content, the system:

1. **🔍 Analyzes Deeply** - Extracts full content, topics, entities, key insights
2. **🧠 Reasons Through Actions** - Plans what to do based on your history and patterns
3. **⚡ Takes Autonomous Actions** - Creates collections, sets reminders, sends notifications
4. **📚 Learns Over Time** - Improves from your behavior patterns

## Architecture

```
┌─────────────────┐
│  Mobile App     │  → Sends content
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  FastifyAPI     │  → Creates capture, queues for processing
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Bull Queue     │  → Async processing
└────────┬────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│         AGENT COORDINATOR                 │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐│
│  │ Analyzer │→ │ Planner │→ │ Executor ││
│  └──────────┘  └─────────┘  └──────────┘│
│         ↓                                 │
│  ┌──────────┐                            │
│  │ Learner  │ ← Records outcomes         │
│  └──────────┘                            │
└──────────────────────────────────────────┘
         │
         ↓
    ✅ Complete
```

## Tech Stack

- **Framework**: Fastify (TypeScript)
- **Database**: Supabase (PostgreSQL) + Prisma ORM
- **Queue**: Redis + Bull
- **AI**: GPT-4 via Supermemory
- **Content Analysis**: Jina AI Reader API
- **Notifications**: Firebase Cloud Messaging (FCM) - **NO SMS**
- **Calendar**: Google Calendar API
- **Voice**: LiveKit SDK

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL (via Supabase)
- Redis

### 2. Install Dependencies

**Backend (TypeScript/Node.js):**
```bash
npm install
```

**Python Downloader Tool (optional):**
```bash
pip install -r requirements.txt
```
See `download_test/README.md` for more details on the media downloader and AI processor.

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required keys:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key (used by Supermemory proxy)
- `OPENAI_BASE_URL` - OpenAI-compatible base URL (optional, e.g. Cerebras)
- `OPENAI_MODEL` - Default chat model (optional, overrides built-in default)
- `SUPERMEMORY_API_KEY` - Supermemory API key
- `JINA_API_KEY` - Jina AI API key
- `JWT_SECRET` - Secret for JWT tokens (min 32 chars)

Optional but recommended:
- `FIREBASE_*` - For push notifications
- `GOOGLE_*` - For calendar integration
- `LIVEKIT_*` - For voice features

### 4. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Or run migrations
npm run prisma:migrate
```

### 5. Start Services

**Development (API + Workers)**:
```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Workers
npm run worker
```

**Production**:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/fcm-token` - Update FCM token for push notifications
- `GET /api/auth/me` - Get current user

### Captures (Main Agentic Entry Point)
- `POST /api/captures` - **Create capture** (triggers autonomous processing)
- `GET /api/captures` - List captures
- `GET /api/captures/:id` - Get single capture
- `DELETE /api/captures/:id` - Delete capture
- `GET /api/captures/search?q=query` - Search captures

### Chat (AI Assistant)
- `POST /api/chat` - Chat with AI (has access to all your saved content)
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history

### Reminders
- `POST /api/reminders` - Create reminder
- `GET /api/reminders` - List reminders
- `PATCH /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### Collections
- `POST /api/collections` - Create collection
- `GET /api/collections` - List collections
- `GET /api/collections/:id` - Get collection with captures
- `POST /api/collections/:id/captures` - Add capture to collection
- `DELETE /api/collections/:id/captures/:captureId` - Remove from collection
- `DELETE /api/collections/:id` - Delete collection

### Calendar
- `GET /api/calendar/auth/url` - Get Google OAuth URL
- `GET /api/calendar/auth/callback` - OAuth callback
- `POST /api/calendar/events` - Create calendar event
- `GET /api/calendar/events` - List upcoming events

### Voice
- `POST /api/voice/room` - Create LiveKit voice room

## Example: Creating a Capture

```bash
curl -X POST http://localhost:3000/api/captures \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LINK",
    "content": "https://example.com/article",
    "userInput": "Save this for later"
  }'
```

**What happens next (autonomously):**

1. **Analyzer Agent** fetches full content, extracts topics, entities, key insights
2. **Planner Agent** creates action plan based on analysis and your history
3. **Executor Agent** executes actions:
   - Adds to relevant collection
   - Creates tags
   - Sets reminder if needed
   - Sends push notification
4. **Learner Agent** records outcome for pattern learning

All of this happens **asynchronously** in the background!

## Agentic Features

### 1. Deep Content Analysis
- Full content extraction (not just metadata)
- Topic extraction
- Entity recognition (people, orgs, technologies, locations)
- Key takeaways and action items
- Date detection
- Difficulty assessment

### 2. Autonomous Actions
- **Smart Collections**: Auto-organizes content into themed collections
- **Intelligent Tagging**: Adds relevant tags based on topics
- **Proactive Reminders**: Sets reminders based on urgency and your patterns
- **Calendar Integration**: Creates events from detected dates
- **Context-Aware Notifications**: Tells you what it did and why

### 3. Pattern Learning
- **Save Time Patterns**: Learns when you typically save content
- **Content Preferences**: Understands your favorite topics and formats
- **Notification Timing**: Learns best times to notify you

### 4. Proactive Intelligence
- Runs periodically to find opportunities to help
- Suggests actions: "You've saved 5 articles about React but haven't reviewed them"
- Pattern insights: "You save ML content on weekends"

## Workers

The system runs background workers for async processing:

1. **Capture Processor** - Processes captures through the agent system
2. **Reminder Sender** - Sends scheduled reminders
3. **Proactive Agent** - Finds opportunities to help users

Start workers with:
```bash
npm run worker
```

## Database Schema

Key tables:
- `users` - User accounts
- `captures` - Saved content with AI analysis
- `tags` / `collections` - Organization
- `reminders` - Scheduled reminders
- `chat_messages` - Chat history
- `action_outcomes` - Learning data
- `user_patterns` - Learned patterns
- `notifications` - Push notification history

## Environment Variables Reference

See `.env.example` for all available configuration options.

## Development

```bash
# Run in development mode
npm run dev

# Run workers
npm run worker

# Build for production
npm run build

# Run tests (if added)
npm test

# Prisma Studio (database GUI)
npm run prisma:studio
```

## Deployment

This backend is designed to run on:
- **API**: Railway, Render, Fly.io
- **Database**: Supabase
- **Redis**: Upstash, Railway
- **Workers**: Same service as API or separate dyno

### Environment Variables Required in Production:
- All keys from `.env.example`
- Set `NODE_ENV=production`

## Security Notes

- ✅ All routes except `/health` and `/api/auth/*` require authentication
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Row-level security enforced at app level
- ✅ Input validation with Zod
- ✅ Rate limiting enabled
- ❌ **NO SMS functionality** (only FCM push notifications)

## License

MIT

---

**Built with ❤️ for NexHacks 2026**

*An autonomous AI system that truly thinks, decides, and acts.*
