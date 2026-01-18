# Stash

An autonomous AI system for content management built in 24 hours at NexHacks 2026. Save links, notes, and media - the AI analyzes content, creates collections, sets reminders, and sends notifications automatically.

## What It Does

When you save content, the system:
1. Fetches and analyzes full content (topics, entities, key insights)
2. Plans actions based on analysis and your patterns
3. Executes autonomously (creates collections, tags, reminders, notifications)
4. Learns from outcomes to improve future decisions

## Architecture

**Backend**: Fastify API with autonomous AI agents
**Mobile**: Expo/React Native app with share intent and notifications
**Processing**: Redis + Bull queue for async agent workflows
**Database**: Supabase (PostgreSQL) + Prisma ORM

```
Content → API → Queue → Analyzer → Planner → Executor → Learner
                           ↓          ↓         ↓
                       Analysis    Actions   Learning
```

## Tech Stack

**Backend**
- Fastify (TypeScript)
- Prisma + Supabase
- Redis + Bull
- GPT-4 via Supermemory
- Jina AI Reader
- Firebase FCM
- Google Calendar API
- LiveKit

**Mobile**
- Expo SDK 54
- React Native 0.81
- NativeWind (Tailwind)
- Zustand state management
- Share intent integration

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (Supabase)
- Redis
- Expo Go app (for mobile testing)

### Backend Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run prisma:generate
npm run prisma:push

# Start API server
npm run dev

# Start workers (separate terminal)
npm run worker
```

### Mobile App Setup

```bash
cd app
npm install

# Configure API endpoint in app/src/utils/api.ts
# Start development server
npm start

# Run on device
npm run ios     # iOS
npm run android # Android
```

## Environment Variables

Required:
- `DATABASE_URL` - Supabase PostgreSQL connection
- `REDIS_URL` - Redis connection
- `OPENAI_API_KEY` - OpenAI API key
- `SUPERMEMORY_API_KEY` - Supermemory API key
- `JINA_API_KEY` - Jina AI API key
- `JWT_SECRET` - JWT secret (min 32 chars)

Optional:
- `FIREBASE_*` - Push notifications
- `GOOGLE_*` - Calendar integration
- `LIVEKIT_*` - Voice features

See `.env.example` for complete list.

## API Endpoints

**Auth**
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/fcm-token` - Update FCM token

**Captures**
- `POST /api/captures` - Save content (triggers AI processing)
- `GET /api/captures` - List captures
- `GET /api/captures/search?q=query` - Search

**Chat**
- `POST /api/chat` - Chat with AI assistant
- `GET /api/chat/history` - Get chat history

**Collections**
- `POST /api/collections` - Create collection
- `GET /api/collections` - List collections
- `POST /api/collections/:id/captures` - Add to collection

**Reminders**
- `POST /api/reminders` - Create reminder
- `GET /api/reminders` - List reminders

**Calendar**
- `GET /api/calendar/auth/url` - Google OAuth URL
- `POST /api/calendar/events` - Create event

**Voice**
- `POST /api/voice/room` - Create LiveKit room

## How It Works

### 1. Content Analysis
Extracts full content, topics, entities, key insights, dates, and action items using Jina AI Reader and GPT-4.

### 2. Action Planning
Creates action plan based on:
- Content analysis
- User patterns and preferences
- Historical outcomes

### 3. Autonomous Execution
- Creates or updates collections
- Adds relevant tags
- Sets contextual reminders
- Schedules calendar events
- Sends push notifications

### 4. Pattern Learning
Tracks outcomes and learns:
- Save time patterns
- Content preferences
- Notification timing
- Collection organization

### Background Workers
- `capture-processor` - Processes captures through agent pipeline
- `reminder-sender` - Sends scheduled reminders
- `proactive-agent` - Finds opportunities to help users

## Built With DevSwarm

We used DevSwarm to coordinate multiple AI coding agents working in parallel on isolated Git branches during the hackathon. While one agent focused on frontend development (frontend-dev), others simultaneously implemented backend agent workflows and integrations (ai-actions, supermemory) and performed structured code review and validation (code-review). DevSwarm's branch isolation and single interface allowed us to switch between agents instantly, review changes via pull requests, and merge independently developed features without blocking progress. This parallel workflow removed the bottleneck of waiting on a single agent and was key to shipping a complete, end-to-end working demo within the 24-hour hackathon window.

## Deployment

**Backend**: Railway, Render, Fly.io
**Database**: Supabase
**Redis**: Upstash, Railway
**Mobile**: EAS Build + TestFlight/Play Console

Set `NODE_ENV=production` and configure all environment variables.

## Security

- JWT authentication on all routes except `/health` and `/api/auth/*`
- Password hashing with bcrypt
- Input validation with Zod
- Rate limiting enabled
- Row-level security enforced

## Development

```bash
# Backend development
npm run dev              # API server
npm run worker          # Background workers
npm run build           # Build for production
npm run prisma:studio   # Database GUI

# Mobile development
cd app
npm start               # Expo dev server
npm run ios             # iOS simulator
npm run android         # Android emulator
```

## Project Structure

```
/backend        API server, agents, routes, services
/app            Expo mobile app
/prisma         Database schema
/processes      Python tools for media processing
/scripts        Utility scripts
/docs           Documentation
```

## License

MIT

---

Built for NexHacks 2026
