# Frontend Auth Setup Complete! ✅

## What Was Connected:

### Backend → Frontend Integration

**API Service Created:** `app/src/utils/api.ts`
- Token management with AsyncStorage
- Auth endpoints (register, login, logout, me, onboarding)
- Auto-includes auth token in all requests

**Updated Screens:**
1. **SignUpScreen** - Now calls `/api/auth/register`
   - Added name input field
   - Validates password (min 8 chars, match confirmation)
   - Shows error messages
   - Saves token on success

2. **LoginScreen** - Now calls `/api/auth/login`
   - Real authentication
   - Token saved to AsyncStorage
   - Error handling

3. **OnboardingScreen** - Now calls `/api/auth/onboarding`
   - Saves user metadata (name, role, age, notifications)
   - Syncs with backend before entering app

---

## Setup Instructions:

### 1. Install Missing Dependency

The app needs `@react-native-async-storage/async-storage`:

```bash
cd app
npx expo install @react-native-async-storage/async-storage
```

### 2. Update API URL

In `app/src/utils/api.ts`, change line 4 to your backend URL:

```typescript
const API_URL = 'http://YOUR_COMPUTER_IP:3000'; // e.g., http://192.168.1.100:3000
```

**To find your IP:**
- Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Or use `http://localhost:3000` if testing on same machine

### 3. Run Supabase Schema

In Supabase Dashboard → SQL Editor, run:
```bash
backend/supabase-schema.sql
```

This creates all tables (profiles, captures, etc.) with RLS policies.

### 4. Start Backend

```bash
cd backend
npm install
npm run dev
```

### 5. Start Mobile App

```bash
cd app
npm start
```

---

## Auth Flow:

```
Welcome → SignUp → Onboarding (5 steps) → Main App
              ↓
          /api/auth/register
              ↓
          Token saved
              ↓
          /api/auth/onboarding
              ↓
          Profile updated
```

**Or Login:**
```
Welcome → Login → Main App
            ↓
       /api/auth/login
            ↓
       Token saved
```

---

## Testing:

1. **Signup** → Enter name, email, password
2. **Onboarding** → Fill name, role, age steps
3. Check Supabase → `profiles` table should have your data
4. **Login** → Use same email/password
5. Works! 🎉

---

## Token Storage:

Tokens are stored in AsyncStorage as `auth_token` and automatically included in all API requests via the `Authorization: Bearer <token>` header.

To logout:
```typescript
await api.logout(); // Calls backend + clears local storage
```
