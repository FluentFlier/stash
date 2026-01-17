# Autonomous Reminder System
## Smart Notifications & Proactive Suggestions

> **Feature:** AI agent that proactively reminds you of important items based on your captured memories

---

## 🎯 Core Concept

Stash analyzes your captured memories and proactively sends notifications at optimal times:
- **Morning briefings** - Daily summary of important items
- **Event-based reminders** - Before meetings, deadlines, tasks
- **Smart suggestions** - Pattern recognition, forgotten items, connections

---

## 📅 Reminder Types

### 1. Morning Briefing (Daily at 8am)

**What it does:**
- Analyzes all captures from past week
- Identifies upcoming events, deadlines, tasks
- Surfaces forgotten or important items
- Sends personalized morning notification

**Example notification:**
```
☀️ Good morning! Here's what's important today:

📅 Meeting at 2pm - Review whiteboard notes from Jan 15
📝 Deadline tomorrow - Finish project proposal (captured Jan 14)
💡 Suggestion: You photographed 3 recipe ideas this week but haven't cooked any
```

### 2. Event-Based Reminders

**Triggers:**
- 30 minutes before detected meetings
- 1 day before detected deadlines
- When entering location related to capture (geo-fence)
- Before bedtime if tasks incomplete

**Example:**
```
🔔 Meeting in 30 minutes: Product Roadmap Discussion

📸 Related captures:
- Whiteboard notes (Jan 15)
- Competitor analysis screenshot (Jan 14)
- Budget spreadsheet photo (Jan 13)

Tap to review →
```

### 3. Smart Suggestions (Weekly)

**AI analyzes patterns:**
- Recurring themes in captures
- Incomplete tasks or goals
- Connections between captures
- Forgotten items

**Example:**
```
💡 Weekly Insight

I noticed you've captured 5 different workout routines this month but haven't logged any workouts. 

Want me to:
- Set a daily workout reminder?
- Create a workout plan from your captures?
- Archive these if you've changed your mind?
```

---

## 🏗️ Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  CRON SCHEDULER (Bull Queue)                 │
│         Daily 8am | Pre-event | Weekly | Custom              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  MEMORY ANALYZER (GPT-4)                     │
│    Query Supermemory → Analyze patterns → Generate insights │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION SERVICE (FCM/APNS)                 │
│                  Send push notification                      │
└─────────────────────────────────────────────────────────────┘
```

### Backend Implementation

#### 1. Scheduled Jobs (Bull Queue)

```typescript
import Queue from 'bull';
import { scheduleJob } from 'node-schedule';

// Morning briefing - every day at 8am
const morningBriefingQueue = new Queue('morning-briefing', process.env.REDIS_URL);

morningBriefingQueue.process(async (job) => {
  const { userId } = job.data;
  
  // Query user's recent memories
  const recentCaptures = await db.collection('captures')
    .find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .toArray();
  
  // Analyze with GPT-4 via Supermemory
  const briefing = await generateMorningBriefing(userId, recentCaptures);
  
  // Send notification
  await sendPushNotification(userId, {
    title: '☀️ Good morning!',
    body: briefing.summary,
    data: {
      type: 'morning_briefing',
      captures: briefing.relatedCaptures,
    },
  });
});

// Schedule for all users at 8am
scheduleJob('0 8 * * *', async () => {
  const users = await db.collection('users').find({ notificationsEnabled: true }).toArray();
  
  for (const user of users) {
    await morningBriefingQueue.add({ userId: user._id });
  }
});
```

#### 2. Morning Briefing Generator

```typescript
async function generateMorningBriefing(userId: string, recentCaptures: any[]) {
  const capturesSummary = recentCaptures.map(c => ({
    date: c.createdAt,
    description: c.aiDescription,
    tags: c.analysis?.tags || [],
    actionableItems: c.analysis?.actionable_items || [],
  }));
  
  const briefing = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a personal AI assistant. Generate a morning briefing based on the user's recent captures.

Focus on:
1. Upcoming events/deadlines (today or next 3 days)
2. Important tasks or reminders
3. Patterns or insights
4. Forgotten items that need attention

Keep it concise (3-5 bullet points max). Be helpful and actionable.`
      },
      {
        role: 'user',
        content: `Recent captures:\n${JSON.stringify(capturesSummary, null, 2)}\n\nGenerate today's briefing.`
      }
    ],
    headers: {
      'x-sm-user-id': userId,
      'x-sm-container-tag': `user:${userId}`,
    },
  });
  
  const summary = briefing.choices[0].message.content;
  
  // Extract related captures
  const relatedCaptures = recentCaptures
    .filter(c => c.analysis?.actionable_items?.length > 0)
    .slice(0, 5)
    .map(c => c._id);
  
  return { summary, relatedCaptures };
}
```

#### 3. Event-Based Reminders

```typescript
// Check for upcoming events every hour
const eventReminderQueue = new Queue('event-reminders', process.env.REDIS_URL);

eventReminderQueue.process(async (job) => {
  const now = new Date();
  const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
  
  // Find captures with events in next 30 minutes
  const upcomingEvents = await db.collection('captures')
    .find({
      'analysis.actionable_items.type': 'calendar_event',
      'analysis.actionable_items.date': {
        $gte: now,
        $lte: in30Minutes,
      },
    })
    .toArray();
  
  for (const capture of upcomingEvents) {
    const event = capture.analysis.actionable_items.find(
      item => item.type === 'calendar_event'
    );
    
    // Find related captures
    const relatedCaptures = await findRelatedCaptures(
      capture.userId,
      event.title
    );
    
    await sendPushNotification(capture.userId, {
      title: `🔔 ${event.title} in 30 minutes`,
      body: `${relatedCaptures.length} related captures available`,
      data: {
        type: 'event_reminder',
        eventId: event.id,
        captureIds: relatedCaptures.map(c => c._id),
      },
    });
  }
});

// Run every hour
scheduleJob('0 * * * *', async () => {
  await eventReminderQueue.add({});
});
```

#### 4. Smart Suggestions (Weekly)

```typescript
const smartSuggestionsQueue = new Queue('smart-suggestions', process.env.REDIS_URL);

smartSuggestionsQueue.process(async (job) => {
  const { userId } = job.data;
  
  // Get all user captures
  const allCaptures = await db.collection('captures')
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  
  // Analyze patterns with GPT-4
  const suggestions = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Analyze the user's capture history and identify:
1. Recurring themes or interests
2. Incomplete tasks or goals
3. Forgotten items that need follow-up
4. Connections between captures
5. Actionable suggestions

Provide 1-3 specific, helpful suggestions.`
      },
      {
        role: 'user',
        content: `Captures:\n${JSON.stringify(
          allCaptures.map(c => ({
            date: c.createdAt,
            tags: c.analysis?.tags,
            description: c.aiDescription?.substring(0, 200),
          })),
          null,
          2
        )}`
      }
    ],
    headers: {
      'x-sm-user-id': userId,
      'x-sm-container-tag': `user:${userId}`,
    },
  });
  
  const insight = suggestions.choices[0].message.content;
  
  await sendPushNotification(userId, {
    title: '💡 Weekly Insight',
    body: insight,
    data: {
      type: 'smart_suggestion',
    },
  });
});

// Run every Sunday at 6pm
scheduleJob('0 18 * * 0', async () => {
  const users = await db.collection('users').find({ notificationsEnabled: true }).toArray();
  
  for (const user of users) {
    await smartSuggestionsQueue.add({ userId: user._id });
  }
});
```

#### 5. Helper: Find Related Captures

```typescript
async function findRelatedCaptures(userId: string, query: string) {
  // Use Supermemory semantic search
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Find captures related to the query.'
      },
      {
        role: 'user',
        content: `Find captures about: ${query}`
      }
    ],
    headers: {
      'x-sm-user-id': userId,
      'x-sm-container-tag': `user:${userId}`,
    },
  });
  
  // Supermemory automatically retrieves relevant memories
  // Parse and return capture IDs from context
  
  return await db.collection('captures')
    .find({
      userId,
      $text: { $search: query }
    })
    .limit(5)
    .toArray();
}
```

### Mobile Implementation

#### Notification Handling

```typescript
// app/services/notifications.ts
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle notification tap
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  switch (data.type) {
    case 'morning_briefing':
      navigation.navigate('Briefing', { captures: data.captures });
      break;
    case 'event_reminder':
      navigation.navigate('EventDetails', { eventId: data.eventId });
      break;
    case 'smart_suggestion':
      navigation.navigate('Insights');
      break;
  }
});
```

#### Settings Screen

```typescript
// app/screens/Settings.tsx
export function SettingsScreen() {
  const [morningBriefing, setMorningBriefing] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState(true);
  const [briefingTime, setBriefingTime] = useState('08:00');
  
  return (
    <ScrollView>
      <Text style={styles.header}>Autonomous Reminders</Text>
      
      <Switch
        label="Morning Briefing"
        value={morningBriefing}
        onValueChange={setMorningBriefing}
      />
      
      {morningBriefing && (
        <TimePicker
          label="Briefing Time"
          value={briefingTime}
          onChange={setBriefingTime}
        />
      )}
      
      <Switch
        label="Event Reminders"
        value={eventReminders}
        onValueChange={setEventReminders}
      />
      
      <Switch
        label="Smart Suggestions (Weekly)"
        value={smartSuggestions}
        onValueChange={setSmartSuggestions}
      />
    </ScrollView>
  );
}
```

---

## 🎯 User Experience

### Morning Briefing Flow

1. **8:00 AM** - User receives notification
2. **Tap notification** - Opens briefing screen
3. **See summary** - Important items for today
4. **Tap item** - View related captures
5. **Take action** - Mark complete, snooze, or dismiss

### Event Reminder Flow

1. **30 min before event** - Notification appears
2. **Tap to review** - See all related captures
3. **Quick prep** - Review notes, screenshots, etc.
4. **Join meeting** - Fully prepared

### Smart Suggestion Flow

1. **Weekly notification** - Insight about patterns
2. **Review suggestion** - See AI's analysis
3. **Take action** - Accept, customize, or dismiss
4. **Feedback loop** - AI learns preferences

---

## 📊 Analytics & Learning

### Track User Engagement

```typescript
// Log notification interactions
await db.collection('notification_analytics').insertOne({
  userId,
  type: 'morning_briefing',
  sentAt: new Date(),
  opened: true,
  openedAt: new Date(),
  actionTaken: 'viewed_captures', // or 'dismissed', 'snoozed'
});
```

### Improve Suggestions Over Time

```typescript
// Adjust notification timing based on engagement
const analytics = await db.collection('notification_analytics')
  .aggregate([
    { $match: { userId, type: 'morning_briefing' } },
    { $group: {
      _id: { $hour: '$openedAt' },
      count: { $sum: 1 }
    }},
    { $sort: { count: -1 } },
    { $limit: 1 }
  ])
  .toArray();

const optimalHour = analytics[0]._id; // When user most often opens
```

---

## 🚀 Implementation Priority

### MVP (Hackathon)
- ✅ Morning briefing (8am daily)
- ✅ Basic event reminders (30 min before)
- ✅ Settings to enable/disable

### Stretch Goals
- ⭐ Smart suggestions (weekly)
- ⭐ Custom reminder times
- ⭐ Geo-fence reminders
- ⭐ Learning from user behavior

---

## 🎬 Demo Script Addition

**[3:30-4:00] Autonomous Features**
- Show morning briefing notification
- "Every morning, Stash analyzes your memories and surfaces what's important"
- Tap notification → see briefing with related captures
- Show event reminder 30 min before meeting
- "It knows when you need information and proactively helps"

---

## 💡 Technical Notes

**Dependencies:**
```bash
npm install node-schedule
npm install @react-native-firebase/messaging # For FCM
```

**Environment Variables:**
```bash
FCM_SERVER_KEY=...
APNS_KEY_ID=...
APNS_TEAM_ID=...
```

**Database Schema:**
```typescript
// User preferences
{
  userId: ObjectId,
  notifications: {
    morningBriefing: {
      enabled: true,
      time: '08:00',
      timezone: 'America/New_York'
    },
    eventReminders: {
      enabled: true,
      minutesBefore: 30
    },
    smartSuggestions: {
      enabled: true,
      frequency: 'weekly' // or 'daily', 'monthly'
    }
  }
}
```

---

**This makes Stash truly proactive - not just a passive memory store, but an active AI assistant! 🧠✨**
