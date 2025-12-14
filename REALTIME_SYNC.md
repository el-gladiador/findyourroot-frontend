# Real-Time Sync Implementation

## Overview

The app now supports **automatic real-time updates** across all users' devices. The implementation is **database-agnostic** and uses the optimal strategy for each backend:

### 🔥 Firestore Backend (Production)
- Uses **Firestore real-time listeners**
- Instant updates across all devices
- Efficient, no polling needed
- Automatic reconnection

### 🐘 PostgreSQL Backend (Development/Alternative)
- Uses **polling** (every 5 seconds)
- Works with any database
- Simple, reliable
- No additional setup needed

## How It Works

The system **automatically detects** which backend you're using:

```
User makes a change (add/edit/delete)
         ↓
Change saved to backend
         ↓
    ┌────────────────┐
    │  Backend Type? │
    └────────────────┘
           ↓
    ┌──────┴──────┐
    │             │
Firestore      Other DB
    │             │
Real-time    Polling
Listener    (5 seconds)
    │             │
    └──────┬──────┘
           ↓
All users see the update
```

## Setup

### Option 1: Firestore Real-Time (Recommended for Production)

1. **Get Firebase Config:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Copy the config values

2. **Configure Frontend:**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

3. **Add Firebase credentials to `.env.local`:**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

4. **Restart the frontend:**
   ```bash
   npm run dev
   ```

   You'll see in console: `[Realtime Sync] Using Firestore real-time listeners`

### Option 2: Polling (Works with Any Backend)

If you don't configure Firebase, the app automatically uses polling:

1. **No configuration needed!**
2. The app will poll every 5 seconds
3. You'll see in console: `[Realtime Sync] Using polling (every 5 seconds)`

This works with:
- PostgreSQL
- MySQL
- MongoDB
- Any other database

## Testing Real-Time Sync

1. **Open the app in 2 browser windows** (or 2 devices)
2. **Login on both**
3. **Add/edit/delete a person in one window**
4. **Watch the other window update automatically!**

### Firestore:
- ⚡ Updates appear **instantly** (< 1 second)

### Polling:
- 🔄 Updates appear within **5 seconds**

## Architecture Benefits

✅ **Database-agnostic** - Works with any backend  
✅ **No code changes** needed when switching databases  
✅ **Optimal for each environment** - Firestore gets real-time, others get polling  
✅ **Fallback mechanism** - If Firestore fails, automatically falls back to polling  
✅ **Future-proof** - Easy to add WebSockets or other sync methods later  

## File Structure

```
frontend/
├── lib/
│   ├── firebase.ts          # Firebase initialization (optional)
│   ├── realtime-sync.ts     # Smart sync hook (Firestore + Polling)
│   └── store.ts             # Updated with setFamilyData method
├── app/
│   └── page.tsx             # Enabled real-time sync
└── .env.example             # Firebase config template
```

## Switching Databases

The system automatically adapts when you change databases:

1. **Switch backend to PostgreSQL:**
   - Remove Firebase config from `.env.local`
   - Restart frontend
   - Automatically uses polling ✅

2. **Switch backend to Firestore:**
   - Add Firebase config to `.env.local`
   - Restart frontend
   - Automatically uses real-time listeners ✅

No code changes required!

## Performance

### Firestore Real-Time
- **Bandwidth:** Minimal (only changed documents)
- **Latency:** < 1 second
- **Cost:** Free tier: 50K document reads/day

### Polling
- **Bandwidth:** ~12 requests/minute per user
- **Latency:** Up to 5 seconds
- **Cost:** Free (uses existing REST API)

## Troubleshooting

### "Real-time updates not working"

**Check console logs:**
- `[Realtime Sync] Using Firestore real-time listeners` → Firestore is active
- `[Realtime Sync] Using polling (every 5 seconds)` → Polling is active

**If using Firestore:**
1. Verify Firebase config in `.env.local`
2. Check Firestore security rules allow read access
3. Verify backend is writing to Firestore

**If using Polling:**
1. Check network tab - should see API calls every 5 seconds
2. Verify backend API is responding

### "Permission denied" (Firestore)

Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /people/{personId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Future Enhancements

This architecture makes it easy to add:
- 🔌 WebSocket support (for database-agnostic real-time)
- 📡 Server-Sent Events (SSE)
- ⚡ Optimistic updates
- 🔄 Offline support with sync queue

The modular design means you can swap sync strategies without touching the rest of the codebase!
