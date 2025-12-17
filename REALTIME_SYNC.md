# Real-Time Sync Implementation

## Overview

The app supports **automatic real-time updates** across all users' devices using a combination of:

1. **SSE (Server-Sent Events)** - For admin data (suggestions, permission requests, identity claims)
2. **Polling** - For family tree data (every 5 seconds)

**No Firebase SDK required!** - The backend uses Cloud Firestore directly via the Admin SDK.

## How It Works

### Family Tree Data (Polling)

```
User makes a change (add/edit/delete)
         ↓
Change saved to backend (Cloud Firestore)
         ↓
Other users poll every 5 seconds
         ↓
All users see the update
```

### Admin Data (SSE - Real-time)

```
User submits suggestion/request/claim
         ↓
Saved to Cloud Firestore
         ↓
Backend's Firestore snapshot listener detects change
         ↓
Backend broadcasts via SSE to all connected admins
         ↓
⚡ Admins see update instantly
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                      │
│                                                               │
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │ useRealtimeSync │    │ useRealtimeAdminSync             │ │
│  │   (Polling)     │    │   (SSE Connection)               │ │
│  │  Every 5 sec    │    │   /api/v1/stream/admin           │ │
│  └────────┬────────┘    └──────────────┬───────────────────┘ │
│           │                            │                      │
└───────────┼────────────────────────────┼──────────────────────┘
            │                            │
            │  REST API                  │  SSE Stream
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Go + Gin)                        │
│                                                               │
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │   REST Handlers │    │   SSE Handler                    │ │
│  │   (tree.go)     │    │   (sse.go)                       │ │
│  │                 │    │   - Firestore Snapshot Listeners │ │
│  │                 │    │   - Broadcasts to connected      │ │
│  │                 │    │     admin clients                │ │
│  └────────┬────────┘    └──────────────┬───────────────────┘ │
│           │                            │                      │
└───────────┼────────────────────────────┼──────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloud Firestore (GCP)                      │
│                                                               │
│   Collections: people, suggestions, permission_requests,     │
│                identity_claims, users                        │
└─────────────────────────────────────────────────────────────┘
```

## Setup

1. **Configure API URL:**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Set your backend URL in `.env.local`:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

## Testing Real-Time Sync

### Family Data (Polling):
1. Open the app in 2 browser windows
2. Login on both
3. Add/edit/delete a person in one window
4. Watch the other window update within 5 seconds

### Admin Data (SSE - Real-time):
1. Open admin panel in 2 browser windows (as admin users)
2. Submit a suggestion from a regular user
3. Both admin windows should see it **instantly**

Console logs to verify:
- `[Realtime Sync] Using polling (every 5 seconds)` - Family data sync active
- `[Admin SSE] Connected` - SSE stream active for admin data

## File Structure

```
frontend/
├── lib/
│   ├── realtime-sync.ts     # Sync hooks (polling + SSE)
│   ├── api.ts               # REST API client
│   └── store.ts             # Zustand store
├── app/
│   └── page.tsx             # Uses useRealtimeSync()
└── components/
    └── tabs/
        └── AdminTab.tsx     # Uses useRealtimeAdminSync()

backend/
├── internal/
│   └── handlers/
│       ├── sse.go           # SSE handler with Firestore listeners
│       ├── tree.go          # Tree REST endpoints
│       └── ...
```

## Performance

### Family Data (Polling)
- **Bandwidth:** ~12 requests/minute per user
- **Latency:** Up to 5 seconds
- **Cost:** Standard Cloud Run + Firestore costs

### Admin Data (SSE)
- **Bandwidth:** Minimal (event-driven)
- **Latency:** < 1 second
- **Cost:** Minimal (single connection per admin)

## Troubleshooting

### "Real-time updates not working"

**Check console logs:**
- `[Realtime Sync] Using polling (every 5 seconds)` → Polling active
- `[Admin SSE] Connected` → SSE active

**Common issues:**
1. **CORS errors** - Ensure backend allows your frontend origin
2. **SSE disconnects** - Auto-reconnects after 3 seconds
3. **Token expiry** - Re-login to get fresh token

### "Admin SSE not connecting"

1. Verify you're logged in as admin/co-admin
2. Check network tab for SSE connection to `/api/v1/stream/admin`
3. Ensure backend is running and accessible

## Future Enhancements

Possible improvements:
- 🔌 WebSocket support for bidirectional communication
- ⚡ Optimistic updates for instant UI feedback
- 🔄 Offline support with sync queue
- 📱 Push notifications for mobile
