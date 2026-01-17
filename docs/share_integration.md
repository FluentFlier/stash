# Share Integration Strategy
## How Users Capture Content in Stash

> **Question:** Should we use native share extensions or SMS-based sharing?  
> **Answer:** Start with in-app camera, add SMS as stretch goal

---

## 🎯 Recommended Approach for Hackathon

### **MVP (Hours 0-12): In-App Camera Only**
- Users open Stash app → capture photo/video directly
- Simplest implementation, zero complexity
- Gets core functionality working fast

### **Stretch Goal (Hours 12-18): SMS Sharing**
- Text photos/links to Stash phone number
- Easier than native share extensions
- Works from ANY app without installation

### **Post-Hackathon: Native Share Extensions**
- Full iOS/Android share sheet integration
- Requires more time and native code
- Best UX but complex for 24-hour hackathon

---

## 📊 Comparison Table

| Approach | Complexity | Time to Build | UX Quality | Works From |
|----------|-----------|---------------|------------|------------|
| **In-App Camera** | ⭐ Easy | 2-4 hours | Good | Stash app only |
| **SMS Sharing** | ⭐⭐ Medium | 4-6 hours | Great | Any app (via SMS) |
| **Share Extensions** | ⭐⭐⭐⭐⭐ Hard | 12+ hours | Excellent | Any app (native) |

---

## 🚀 Option 1: In-App Camera (MVP - RECOMMENDED)

### Why Start Here
- ✅ **Fast to build** - 2-4 hours
- ✅ **Zero dependencies** - Just Expo camera
- ✅ **Reliable** - No external services
- ✅ **Good enough** - Proves core concept

### Implementation

Already covered in your implementation plan! Just use:
```typescript
import { CameraView } from 'expo-camera';

// Capture photo
const photo = await cameraRef.current.takePictureAsync();
await uploadMedia(photo.uri, 'photo');

// Capture video
const video = await cameraRef.current.recordAsync({ maxDuration: 30 });
await uploadMedia(video.uri, 'video');
```

### Limitations
- ❌ Can't share from other apps (Safari, Twitter, etc.)
- ❌ Users must open Stash first
- ❌ Not as convenient as share sheet

---

## 📱 Option 2: SMS Sharing (STRETCH GOAL)

### Why This is Better Than Share Extensions for Hackathon

**Pros:**
- ✅ **Works from ANY app** - Just share to Messages
- ✅ **No installation complexity** - Users text a number
- ✅ **Easier to build** - Backend webhook only
- ✅ **Cross-platform** - iOS + Android automatically
- ✅ **Familiar UX** - Everyone knows how to text

**Cons:**
- ❌ Requires Twilio account ($15/month for number)
- ❌ Extra step (share → Messages → send)
- ❌ Can't capture videos easily (MMS limits)

### How It Works

```
User Flow:
1. User sees link/screenshot in Safari
2. Tap Share → Messages
3. Text to Stash number: (555) 123-STASH
4. Twilio receives SMS → webhook to your backend
5. Backend processes image/link → stores in Stash
6. User gets confirmation text
7. Opens Stash app → sees analyzed content
```

### Implementation

#### Step 1: Get Twilio Number

```bash
# Sign up at twilio.com
# Buy a phone number ($1-2/month)
# Get Account SID and Auth Token
```

#### Step 2: Backend Webhook

```typescript
// routes/sms.ts
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function smsRoutes(fastify: FastifyInstance) {
  // Webhook for incoming SMS
  fastify.post('/api/sms/webhook', async (request, reply) => {
    const { From, Body, MediaUrl0, NumMedia } = request.body;
    
    // Extract phone number (this is the user)
    const phoneNumber = From;
    
    // Find or create user by phone number
    let user = await db.collection('users').findOne({ phoneNumber });
    if (!user) {
      user = await db.collection('users').insertOne({
        phoneNumber,
        createdAt: new Date(),
      });
    }
    
    // Handle image/video MMS
    if (NumMedia > 0 && MediaUrl0) {
      // Download media from Twilio
      const mediaResponse = await fetch(MediaUrl0);
      const mediaBuffer = await mediaResponse.arrayBuffer();
      
      // Upload to R2
      const captureId = new ObjectId();
      const fileType = mediaResponse.headers.get('content-type');
      const extension = fileType.includes('video') ? 'mp4' : 'jpg';
      const key = `users/${user._id}/captures/${captureId}/media.${extension}`;
      
      await uploadToR2(key, Buffer.from(mediaBuffer));
      
      // Create capture record
      await db.collection('captures').insertOne({
        _id: captureId,
        userId: user._id,
        type: fileType.includes('video') ? 'video' : 'photo',
        status: 'processing',
        r2Key: key,
        caption: Body, // User's text message
        createdAt: new Date(),
      });
      
      // Trigger processing
      await processingQueue.add('process-capture', { captureId });
      
      // Send confirmation SMS
      await twilioClient.messages.create({
        body: '✅ Got it! Processing your capture now. Open Stash to see results.',
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
    }
    // Handle text-only (URLs, notes)
    else if (Body) {
      // Check if it's a URL
      const urlMatch = Body.match(/(https?:\/\/[^\s]+)/);
      
      if (urlMatch) {
        const url = urlMatch[0];
        
        // Fetch URL metadata
        const metadata = await fetchUrlMetadata(url);
        
        // Create capture for link
        const captureId = new ObjectId();
        await db.collection('captures').insertOne({
          _id: captureId,
          userId: user._id,
          type: 'link',
          status: 'ready',
          url,
          metadata,
          caption: Body.replace(url, '').trim(),
          createdAt: new Date(),
        });
        
        await twilioClient.messages.create({
          body: `✅ Saved: ${metadata.title || url}`,
          to: phoneNumber,
          from: process.env.TWILIO_PHONE_NUMBER,
        });
      } else {
        // Just a text note
        const captureId = new ObjectId();
        await db.collection('captures').insertOne({
          _id: captureId,
          userId: user._id,
          type: 'note',
          status: 'ready',
          text: Body,
          createdAt: new Date(),
        });
        
        await twilioClient.messages.create({
          body: '✅ Note saved!',
          to: phoneNumber,
          from: process.env.TWILIO_PHONE_NUMBER,
        });
      }
    }
    
    // Respond with TwiML (required by Twilio)
    reply.type('text/xml');
    return '<Response></Response>';
  });
}
```

#### Step 3: Configure Twilio Webhook

```
1. Go to Twilio Console
2. Select your phone number
3. Under "Messaging" → "A Message Comes In"
4. Set to: https://your-backend.com/api/sms/webhook
5. Method: POST
6. Save
```

#### Step 4: Mobile App - Link Phone Number

```typescript
// app/screens/Settings.tsx
export function SettingsScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const linkPhoneNumber = async () => {
    // Send verification code via SMS
    await fetch(`${API_URL}/api/user/link-phone`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
    
    // User receives SMS with code
    // They enter code to verify
  };
  
  return (
    <View>
      <Text>Link Your Phone Number</Text>
      <Text>Text photos to: (555) 123-STASH</Text>
      
      <TextInput
        placeholder="Your phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      
      <Button title="Link Number" onPress={linkPhoneNumber} />
    </View>
  );
}
```

### Cost
- Twilio phone number: ~$1/month
- Incoming SMS: $0.0075 per message
- Incoming MMS (images): $0.01 per message
- **Total for hackathon:** ~$15 (includes $10 trial credit)

### Demo Flow

```
1. Show Safari with article
2. Tap Share → Messages
3. Text to (555) 123-STASH
4. Receive confirmation text
5. Open Stash app
6. See article analyzed with AI summary
```

---

## 🎨 Option 3: Native Share Extensions (POST-HACKATHON)

### Why NOT for Hackathon
- ⏰ **12+ hours to implement** - Too long
- 🐛 **Complex debugging** - Native code issues
- 📱 **Platform-specific** - iOS and Android different
- 🔧 **Requires ejecting from Expo** - Loses managed workflow benefits

### How It Would Work

Users tap Share button in ANY app → Stash appears in share sheet → Select Stash → Content captured

### Implementation Overview (For Reference)

#### Using `expo-share-intent` Package

```bash
npm install expo-share-intent
```

```typescript
// app.config.js
export default {
  plugins: [
    [
      'expo-share-intent',
      {
        iosActivationRules: {
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsImageWithMaxCount: 1,
          NSExtensionActivationSupportsMovieWithMaxCount: 1,
        },
        androidIntentFilters: ['text/*', 'image/*', 'video/*'],
      },
    ],
  ],
};
```

```typescript
// App.tsx
import { useShareIntent } from 'expo-share-intent';

export default function App() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  
  useEffect(() => {
    if (hasShareIntent) {
      // Handle shared content
      const { type, url, text, files } = shareIntent;
      
      if (files && files.length > 0) {
        // Handle shared images/videos
        uploadSharedMedia(files[0]);
      } else if (url) {
        // Handle shared URL
        saveSharedLink(url);
      }
      
      resetShareIntent();
    }
  }, [hasShareIntent]);
}
```

### Challenges
- iOS memory limits (120MB for extensions)
- Provisioning profile issues
- Native code debugging
- Platform-specific quirks

---

## 🎯 Recommended Implementation Timeline

### Hours 0-4: In-App Camera (MVP)
- ✅ Camera capture working
- ✅ Upload to R2
- ✅ Basic processing

### Hours 4-8: Core Features
- ✅ GPT-4V analysis
- ✅ Voice chat
- ✅ Memory retrieval

### Hours 8-12: Polish
- ✅ UI improvements
- ✅ Error handling
- ✅ Testing

### Hours 12-16: SMS Sharing (STRETCH)
- ⭐ Set up Twilio
- ⭐ Implement webhook
- ⭐ Phone number linking
- ⭐ Test end-to-end

### Hours 16-24: Final Polish
- Demo preparation
- Bug fixes
- Presentation

---

## 💡 Hybrid Approach (RECOMMENDED)

**For Demo:**
1. **Primary:** Show in-app camera capture
2. **Wow Factor:** Demo SMS sharing
   - "But wait, you can also text photos to Stash!"
   - Show sharing from Safari via SMS
   - Receive confirmation text
   - Open app to see analyzed content

**Why This Works:**
- ✅ Core functionality proven (in-app camera)
- ✅ Differentiation (SMS sharing is unique)
- ✅ Achievable in 24 hours
- ✅ Shows innovation without over-complexity

---

## 📝 Updated Team Workflow

**Person 3 (Mobile Lead):**
- Hours 0-8: In-app camera + upload (as planned)
- Hours 8-12: UI polish
- **Hours 12-16: SMS phone number linking UI**

**Person 1 (Backend Lead):**
- Hours 0-12: Core backend (as planned)
- **Hours 12-16: Twilio SMS webhook**
- Hours 16-24: Deployment

---

## 🎬 Demo Script Update

**[2:00-2:30] SMS Sharing Demo**
- "You can also share from ANY app"
- Open Safari, find article
- Share → Messages → Text to Stash
- Receive confirmation
- Open Stash → see analyzed article
- "No app installation needed, just text us!"

---

## 🚀 Quick Start: SMS Sharing

```bash
# 1. Sign up for Twilio (free trial)
https://www.twilio.com/try-twilio

# 2. Buy phone number
# Console → Phone Numbers → Buy a Number
# Cost: ~$1/month

# 3. Get credentials
# Console → Account → API Keys
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+15551234567

# 4. Install SDK
npm install twilio

# 5. Configure webhook
# Phone Number → Messaging → Webhook
# URL: https://your-backend.com/api/sms/webhook
# Method: POST
```

---

**Bottom Line:** Start with in-app camera (safe), add SMS if time permits (impressive), skip native share extensions (too complex for hackathon). 🚀
