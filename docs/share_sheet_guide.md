# Share Sheet Implementation Guide
## Native iOS/Android Share Extension with expo-share-intent

> **Goal:** Make Stash appear in the native share sheet when users tap "Share" in any app

---

## 📋 Overview

When a user taps "Share" in Safari, Twitter, Photos, or any other app, Stash will appear as a share destination. The shared content (text, URLs, images, videos) is captured and sent to your backend for processing.

**Tech Stack:**
- `expo-share-intent` - Handles share extensions for both iOS and Android
- React Native - Main app
- Supabase - Backend storage and processing

---

## 🚀 Implementation Steps

### Step 1: Install Dependencies

```bash
npx expo install expo-share-intent
```

### Step 2: Configure app.config.js

```javascript
// app.config.js
export default {
  name: 'Stash',
  slug: 'stash',
  version: '1.0.0',
  scheme: 'stash', // For deep linking
  
  plugins: [
    [
      'expo-share-intent',
      {
        // iOS Configuration
        iosActivationRules: {
          // Accept URLs
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          // Accept images
          NSExtensionActivationSupportsImageWithMaxCount: 5,
          // Accept videos
          NSExtensionActivationSupportsMovieWithMaxCount: 1,
          // Accept text
          NSExtensionActivationSupportsText: true,
          // Accept files
          NSExtensionActivationSupportsFileWithMaxCount: 5,
        },
        
        // Android Configuration
        androidIntentFilters: [
          'text/*',
          'image/*',
          'video/*',
          'application/*',
        ],
        
        // App name shown in share sheet
        androidMainActivityAttributes: {
          'android:launchMode': 'singleTask',
        },
      },
    ],
  ],
  
  ios: {
    bundleIdentifier: 'com.yourteam.stash',
    supportsTablet: true,
  },
  
  android: {
    package: 'com.yourteam.stash',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
};
```

### Step 3: Handle Share Intent in App

```typescript
// App.tsx
import { useShareIntent } from 'expo-share-intent';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { supabase } from './lib/supabase';

export default function App() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent({
    debug: true, // Enable logging during development
    resetOnBackground: true, // Reset when app goes to background
  });
  
  const navigation = useNavigation();
  
  useEffect(() => {
    if (hasShareIntent && shareIntent) {
      handleSharedContent(shareIntent);
    }
  }, [hasShareIntent, shareIntent]);
  
  const handleSharedContent = async (intent) => {
    try {
      const { type, text, webUrl, files } = intent;
      
      console.log('Received share intent:', { type, text, webUrl, files });
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login if not authenticated
        navigation.navigate('Login');
        resetShareIntent();
        return;
      }
      
      let captureId;
      
      // Handle different content types
      if (files && files.length > 0) {
        // Handle shared images/videos
        captureId = await handleSharedFiles(files, user.id, text);
      } else if (webUrl) {
        // Handle shared URL
        captureId = await handleSharedUrl(webUrl, user.id, text);
      } else if (text) {
        // Handle shared text
        captureId = await handleSharedText(text, user.id);
      }
      
      // Reset the share intent
      resetShareIntent();
      
      // Navigate to the capture detail screen
      if (captureId) {
        navigation.navigate('CaptureDetail', { captureId });
      }
      
    } catch (error) {
      console.error('Error handling share intent:', error);
      resetShareIntent();
    }
  };
  
  return (
    <NavigationContainer>
      {/* Your app navigation */}
    </NavigationContainer>
  );
}
```

### Step 4: Upload Shared Files to Supabase

```typescript
// lib/shareHandlers.ts
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

export async function handleSharedFiles(
  files: Array<{ path: string; mimeType: string }>,
  userId: string,
  caption?: string
) {
  const captureId = crypto.randomUUID();
  
  for (const file of files) {
    const fileName = file.path.split('/').pop();
    const fileType = file.mimeType.startsWith('image') ? 'image' : 'video';
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(file.path, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert to blob
    const blob = await fetch(`data:${file.mimeType};base64,${base64}`).then(r => r.blob());
    
    // Upload to Supabase Storage
    const storagePath = `${userId}/${captureId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('captures')
      .upload(storagePath, blob, {
        contentType: file.mimeType,
        upsert: false,
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('captures')
      .getPublicUrl(storagePath);
    
    // Create database record
    await supabase.from('captures').insert({
      id: captureId,
      user_id: userId,
      type: fileType,
      url: publicUrl,
      raw_text: caption || null,
      status: 'processing',
      created_at: new Date().toISOString(),
    });
  }
  
  return captureId;
}

export async function handleSharedUrl(
  url: string,
  userId: string,
  caption?: string
) {
  const captureId = crypto.randomUUID();
  
  // Fetch URL metadata (title, description, image)
  const metadata = await fetchUrlMetadata(url);
  
  await supabase.from('captures').insert({
    id: captureId,
    user_id: userId,
    type: 'link',
    url: url,
    raw_text: caption || null,
    metadata: metadata,
    status: 'ready', // Links don't need processing
    created_at: new Date().toISOString(),
  });
  
  return captureId;
}

export async function handleSharedText(
  text: string,
  userId: string
) {
  const captureId = crypto.randomUUID();
  
  await supabase.from('captures').insert({
    id: captureId,
    user_id: userId,
    type: 'text',
    raw_text: text,
    status: 'processing', // Will extract entities, dates, etc.
    created_at: new Date().toISOString(),
  });
  
  return captureId;
}

async function fetchUrlMetadata(url: string) {
  try {
    // Use a metadata extraction service or API
    const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    return {
      title: data.data.title,
      description: data.data.description,
      image: data.data.image?.url,
      author: data.data.author,
      publisher: data.data.publisher,
    };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return null;
  }
}
```

### Step 5: Deep Linking Configuration

```typescript
// app/navigation/linking.ts
const linking = {
  prefixes: ['stash://', 'https://stash.app'],
  config: {
    screens: {
      Home: {
        screens: {
          Store: 'store',
          Chat: 'chat',
        },
      },
      CaptureDetail: 'capture/:captureId',
      Login: 'login',
    },
  },
};

export default linking;
```

```typescript
// App.tsx
import linking from './navigation/linking';

<NavigationContainer linking={linking}>
  {/* Your navigation */}
</NavigationContainer>
```

---

## 🎨 User Experience Flow

### 1. User Shares Content

```
Safari → Article → Share button → Stash appears in share sheet
```

### 2. Share Extension Activates

```
- Extension receives content
- Shows brief loading indicator
- Uploads to Supabase
- Opens main app via deep link
```

### 3. Main App Opens

```
- Deep link navigates to CaptureDetail screen
- Shows "Processing..." state
- Backend extracts metadata
- Updates to show rich preview + suggestions
```

### 4. User Sees Result

```
┌─────────────────────────────────────────┐
│  ← Back to Store                        │
├─────────────────────────────────────────┤
│  📄 Article Title                       │
│  techcrunch.com • 2 min read            │
├─────────────────────────────────────────┤
│  [Article preview image]                │
├─────────────────────────────────────────┤
│  💡 Suggested Actions:                  │
│  • Add to reading list                  │
│  • Set reminder for tomorrow            │
│  • Share with team                      │
├─────────────────────────────────────────┤
│  📝 Add note (optional)                 │
│  [Text input]                           │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: Share extension doesn't appear

**Solution:**
1. Rebuild the app: `npx expo prebuild --clean`
2. Check `app.config.js` plugin configuration
3. Verify bundle identifier matches in both app and extension
4. On iOS: Check provisioning profiles include app extensions

### Issue: App crashes when sharing

**Solution:**
1. Check memory usage (iOS extensions have 120MB limit)
2. Ensure you're not loading heavy dependencies in share extension
3. Use `debug: true` in `useShareIntent` to see logs

### Issue: Files not uploading

**Solution:**
1. Verify Supabase Storage bucket is public or has correct RLS policies
2. Check file size limits (Supabase free tier: 1GB storage)
3. Ensure file paths are correct (use `FileSystem.readAsStringAsync`)

---

## 📱 Platform-Specific Notes

### iOS

**Memory Limit:** 120MB for share extensions
- Keep extension code minimal
- Don't load heavy libraries in extension
- Upload files, then process in main app

**Permissions:**
- Share extension inherits app permissions
- Request camera/photo library access in main app first

**Testing:**
- Use Xcode to debug share extension
- Check Console.app for extension logs

### Android

**Intent Filters:**
- Configure in `app.config.js` under `androidIntentFilters`
- Be specific about MIME types to avoid appearing everywhere

**Testing:**
- Use `adb logcat` to see logs
- Test with different apps (Chrome, Gallery, etc.)

---

## ✅ Testing Checklist

- [ ] Share text from Notes app
- [ ] Share URL from Safari
- [ ] Share image from Photos
- [ ] Share video from Photos
- [ ] Share multiple images
- [ ] Share from Twitter/X
- [ ] Share from Messages
- [ ] Test deep linking works
- [ ] Test when app is closed
- [ ] Test when app is in background
- [ ] Test when app is already open

---

## 🚀 Build Commands

```bash
# Development build with share extension
npx expo prebuild
npx expo run:ios
npx expo run:android

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

## 📚 Resources

- [expo-share-intent documentation](https://www.npmjs.com/package/expo-share-intent)
- [Expo deep linking guide](https://docs.expo.dev/guides/deep-linking/)
- [Supabase Storage docs](https://supabase.com/docs/guides/storage)

---

**Next:** Define frontend app spec (UI system, colors, components) 🎨
