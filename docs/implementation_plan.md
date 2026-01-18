# Stash - Visual AI Memory Assistant
## Technical Implementation Plan

> **Project:** AI personal secretary for visual memories  
> **Hackathon:** NexHacks 2026 (Jan 17-18, Carnegie Mellon)  
> **Stack:** React Native + GPT-4V + Supermemory + LiveKit

---

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Architecture](#architecture)
4. [Visual Processing (Photos)](#visual-processing-photos)
5. [Video Processing](#video-processing)
6. [Technology Stack](#technology-stack)
7. [Verification Plan](#verification-plan)

---

## Problem Statement

**Overshoot visual AI processing is not working.** We need alternative solutions for:
- Image analysis (OCR, object detection, scene understanding)
- Video processing (frame extraction, temporal analysis)
- Memory storage and retrieval

---

## Solution Overview

### Recommended Approach: GPT-4 Vision + FFmpeg

**For Images:**
- Use GPT-4 Vision API directly (already in stack via Supermemory)
- Single API call handles OCR, object detection, scene understanding
- No additional services needed

**For Videos:**
- Extract key frames using `fluent-ffmpeg`
- Analyze frames with GPT-4 Vision
- Optional: Transcribe audio with Whisper

**Benefits:**
- ✅ Zero additional setup (reuses existing OpenAI integration)
- ✅ Simpler architecture (fewer dependencies)
- ✅ Faster development (no new SDKs to learn)
- ✅ Cost-effective (no extra API fees)

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  MOBILE APP (React Native)                   │
│              Camera → Capture Photo/Video                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    UPLOAD & STORAGE                          │
│         Cloudflare R2 (media) + MongoDB (metadata)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PROCESSING QUEUE (Bull + Redis)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              VISUAL ANALYSIS (GPT-4 Vision)                  │
│    Photos: Direct analysis | Videos: Frame extraction        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                MEMORY LAYER (Supermemory)                    │
│              Persistent context + semantic search            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  VOICE AGENT (LiveKit)                       │
│           Real-time conversation about memories              │
└─────────────────────────────────────────────────────────────┘
```

---

## Visual Processing (Photos)

### GPT-4 Vision Implementation

**Single API call handles everything:**

```typescript
const analysis = await openai.chat.completions.create({
  model: 'gpt-4-vision-preview',
  messages: [
    {
      role: 'system',
      content: `Analyze this image and provide:
1. Detailed description
2. All visible text (OCR)
3. Objects and their relationships
4. Scene context and setting
5. Suggested tags for organization
6. Actionable items (dates, tasks, reminders)

Format as JSON.`
    },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: imageUrl }
        }
      ]
    }
  ],
  response_format: { type: 'json_object' },
  headers: {
    'x-sm-user-id': userId,
    'x-sm-container-tag': `user:${userId}`,
  },
});

const result = JSON.parse(analysis.choices[0].message.content);
```

### Capabilities

| Feature | GPT-4 Vision | Notes |
|---------|--------------|-------|
| OCR | ✅ Excellent | Handwritten notes, screenshots, documents |
| Object Detection | ✅ Strong | Identifies objects + spatial relationships |
| Scene Understanding | ✅ Excellent | Context, setting, mood |
| Math OCR | ✅ Advanced | Visual equations, formulas |
| Chart/Table Extraction | ✅ Good | Data from graphs, tables |
| Code Generation | ✅ Bonus | LaTeX from equations, Python from flowcharts |

### Alternative Options

#### Claude 3.5 Sonnet (Better Vision Quality)
- Superior OCR accuracy (especially low-quality images)
- Better at complex diagrams and visual reasoning
- Can route through Supermemory or direct Anthropic API

#### Google Cloud Vision (Specialized OCR)
- Best-in-class OCR specifically
- Logo/landmark detection
- Face detection
- Use if GPT-4V OCR insufficient

---

## Video Processing

### Recommended: Frame Extraction + GPT-4V

**Workflow:**
1. Extract 8-10 key frames using ffmpeg
2. Upload frames to R2
3. Analyze all frames with GPT-4V in single call
4. Optional: Extract & transcribe audio with Whisper

### Implementation

#### Step 1: Frame Extraction

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

async function extractFrames(videoUrl: string, captureId: string, userId: string) {
  const tempDir = `/tmp/frames-${captureId}`;
  await fs.mkdir(tempDir, { recursive: true });
  
  // Extract 10 evenly distributed frames
  await new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .screenshots({
        count: 10,
        folder: tempDir,
        filename: 'frame-%i.png',
        size: '1280x720'
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  // Upload frames to R2
  const frameFiles = await fs.readdir(tempDir);
  const frameUrls = await Promise.all(
    frameFiles
      .filter(f => f.endsWith('.png'))
      .sort()
      .map(async (file, i) => {
        const frameBuffer = await fs.readFile(path.join(tempDir, file));
        const frameKey = `users/${userId}/captures/${captureId}/frame-${i}.png`;
        await uploadToR2(frameKey, frameBuffer);
        return getR2PublicUrl(frameKey);
      })
  );
  
  // Cleanup
  await fs.rm(tempDir, { recursive: true });
  
  return frameUrls;
}
```

#### Step 2: Analyze Frames

```typescript
async function analyzeVideo(frameUrls: string[], userId: string) {
  const analysis = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'system',
        content: `Analyze this video by examining ${frameUrls.length} frames. Provide:
1. Overall video summary and narrative
2. Key scenes and transitions
3. All visible text across frames (OCR)
4. Objects and people throughout
5. Actions and events happening
6. Suggested tags
7. Actionable items (dates, tasks, etc.)

Format as JSON.`
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analyzing ${frameUrls.length} frames:` },
          ...frameUrls.map(url => ({
            type: 'image_url' as const,
            image_url: { url }
          }))
        ]
      }
    ],
    response_format: { type: 'json_object' },
    headers: {
      'x-sm-user-id': userId,
      'x-sm-container-tag': `user:${userId}`,
    },
  });
  
  return JSON.parse(analysis.choices[0].message.content);
}
```

#### Step 3: Audio Transcription (Optional)

```typescript
async function extractAndTranscribeAudio(videoUrl: string) {
  const audioPath = `/tmp/audio-${Date.now()}.mp3`;
  
  // Extract audio
  await new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .output(audioPath)
      .audioCodec('libmp3lame')
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
  
  // Transcribe with Whisper
  const audioFile = await fs.readFile(audioPath);
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });
  
  await fs.unlink(audioPath);
  
  return transcription.text;
}
```

#### Complete Video Processing

```typescript
async function processVideoCapture(captureId: string) {
  const capture = await db.collection('captures').findOne({ _id: captureId });
  const videoUrl = getR2PublicUrl(capture.r2Key);
  
  // Extract and analyze frames
  const frameUrls = await extractFrames(videoUrl, captureId, capture.userId);
  const visualAnalysis = await analyzeVideo(frameUrls, capture.userId);
  
  // Optional: Transcribe audio if video > 5 seconds
  let transcript = null;
  if (capture.duration > 5) {
    transcript = await extractAndTranscribeAudio(videoUrl);
  }
  
  // Store results
  await db.collection('captures').updateOne(
    { _id: captureId },
    {
      $set: {
        status: 'ready',
        analysis: visualAnalysis,
        transcript,
        frameUrls,
        processedAt: new Date(),
      },
    }
  );
}
```

### Dependencies

```bash
npm install fluent-ffmpeg @types/fluent-ffmpeg
```

**Note:** Requires ffmpeg binary on server. Options:
- Install via package manager: `apt-get install ffmpeg`
- Use Docker image with ffmpeg pre-installed
- Use `ffmpeg-static` npm package (includes binary)

### Alternative Video Processing Options

#### Google Video Intelligence API
- Advanced features: shot detection, explicit content filtering
- Object tracking across frames
- Automatic speech transcription
- **Use if:** Need specialized video features

#### Amazon Rekognition Video
- Real-time video analysis
- Celebrity recognition
- Custom labeling
- **Use if:** Already on AWS infrastructure

---

## Technology Stack

### Core Services

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Mobile App** | React Native (Expo) | Cross-platform camera app |
| **Backend API** | Fastify (Node.js) | REST API server |
| **Database** | MongoDB | Capture metadata |
| **Storage** | Cloudflare R2 | Media files (photos/videos) |
| **Queue** | Bull + Redis | Async job processing |
| **Vision AI** | GPT-4 Vision | Image/video analysis |
| **Memory** | Supermemory | Persistent context |
| **Voice Agent** | LiveKit | Real-time voice chat |
| **Audio Transcription** | OpenAI Whisper | Speech-to-text |
| **Video Processing** | ffmpeg | Frame extraction |

### API Keys Required

```bash
# .env
MONGODB_URI=mongodb+srv://...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=stash-media
OPENAI_API_KEY=...
SUPERMEMORY_API_KEY=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_WS_URL=wss://...
REDIS_URL=redis://...
```

---

## Verification Plan

### Automated Tests

**1. Unit Tests**
```bash
npm test
```
- Mock GPT-4V responses
- Verify JSON parsing
- Test error handling

**2. Integration Tests**
- Upload sample image → verify analysis
- Upload sample video → verify frame extraction
- Test audio transcription

### Manual Testing

**Photo Processing:**
1. Capture photo of whiteboard with text
2. Verify OCR extracted all text
3. Check object detection accuracy
4. Validate tags are relevant

**Video Processing:**
1. Capture 10-second video
2. Verify 8-10 frames extracted
3. Check video summary quality
4. Test audio transcription (if speech present)

**Voice Interaction:**
1. Create voice session
2. Ask about captured content
3. Verify memory retrieval works
4. Test conversation flow

### Performance Benchmarks

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Photo upload | < 2s | < 5s |
| Photo analysis | < 5s | < 10s |
| Video frame extraction | < 10s | < 20s |
| Video analysis | < 15s | < 30s |
| Voice response | < 2s | < 5s |

---

## Next Steps

1. ✅ **Remove Overshoot** - Delete from dependencies
2. ✅ **Update processing worker** - Use GPT-4V only
3. ⏭️ **Test with sample images** - Verify analysis quality
4. ⏭️ **Implement video processing** - Frame extraction + analysis
5. ⏭️ **Deploy backend** - Vercel/Railway
6. ⏭️ **Build mobile app** - Camera + upload
7. ⏭️ **Integrate LiveKit** - Voice agent
8. ⏭️ **End-to-end testing** - Full user flow
9. ⏭️ **Demo preparation** - Record video, prepare presentation

---

## Success Criteria

### Minimum Viable Demo (Hour 18)
- ✅ Capture photo via mobile
- ✅ Photo uploads to R2
- ✅ GPT-4V analyzes image
- ✅ Results display in app
- ✅ Voice chat works

### Stretch Goals (Hour 24)
- ✅ Video capture & processing
- ✅ Audio transcription
- ✅ Memory timeline view
- ✅ Semantic search
- ✅ Calendar integration

---

**Built for NexHacks 2026 🚀**
