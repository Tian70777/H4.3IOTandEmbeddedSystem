# Mobile Phone Access Guide - Complete Documentation

## 📱 Overview

This guide explains how to access your Smart Home dashboard from a mobile phone, even when the phone and laptop are on different networks. This uses **ngrok** to create a secure tunnel to your local development server.

---

## 🎯 What We Accomplished

**Goal:** Access React dashboard on mobile phone while backend runs on laptop

**Challenge:** Free ngrok allows only 1 tunnel, but we need to expose both frontend (port 5173) and backend WebSocket (port 8080)

**Solution:** Use Vite's proxy feature to route WebSocket through the same tunnel as the frontend

---

## 📋 Setup Process

### 1. Install ngrok

#### Method 1: Manual Download (Recommended)
1. Go to https://ngrok.com/download
2. Click "Download for Windows"
3. Extract `ngrok.zip` → Get `ngrok.exe`
4. Move to convenient location: `C:\Users\twan\Downloads\ngrok\ngrok.exe`

#### Method 2: Chocolatey (Alternative)
```powershell
choco install ngrok
# Note: This failed for user due to permissions
```

### 2. Sign Up for ngrok (Free)
1. Create account: https://dashboard.ngrok.com/signup
2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Authenticate:
```powershell
cd C:\Users\twan\Downloads\ngrok
.\ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 3. Configure Frontend for Remote Access

#### A. Update Vite Config

**File:** `frontend/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true, // Allow external access
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io'], // Allow ngrok domains
    proxy: {
      // Proxy WebSocket through same ngrok tunnel
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  }
})
```

**What each setting does:**
- `host: true` - Allows access from external hosts (not just localhost)
- `allowedHosts` - Whitelists ngrok domains to prevent "Host header" errors
- `proxy` - Routes WebSocket requests through Vite dev server

#### B. Update WebSocket Hook

**File:** `frontend/src/hooks/useWebSocket.ts`

```typescript
// Auto-detect WebSocket URL based on environment
const getWebSocketURL = () => {
  // If custom URL provided, use it
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }
  
  // Local development
  if (window.location.hostname === 'localhost') {
    return 'ws://localhost:8080'
  }
  
  // ngrok or remote access - use wss with same host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

const WS_URL = getWebSocketURL()
```

**Logic:**
1. Check for environment variable (manual override)
2. If localhost → direct connection to `ws://localhost:8080`
3. If remote (ngrok) → use `wss://` (secure) and proxy path `/ws`

#### C. Create .env File (Optional)

**File:** `frontend/.env`

```env
# WebSocket URL for remote access
# Leave empty for auto-detection
VITE_WS_URL=
```

This allows manual override if needed.

---

## 🚀 Running the System

### Terminal 1: Start Backend
```powershell
cd "C:\Users\twan\OneDrive - Danmarks Tekniske Universitet\Desktop\H4\3. IOTandEmbeddedSystem\backend"
npm start
```

**Wait for:**
```
[WebSocket] Server started on port 8080
[MQTT] Connected to broker successfully
```

### Terminal 2: Start Frontend
```powershell
cd "C:\Users\twan\OneDrive - Danmarks Tekniske Universitet\Desktop\H4\3. IOTandEmbeddedSystem\frontend"
npm run dev
```

**Wait for:**
```
VITE v5.0.0  ready in 500 ms
➜  Local:   http://localhost:5173/
```

### Terminal 3: Start ngrok Tunnel
```powershell
cd C:\Users\twan\Downloads\ngrok
.\ngrok http 5173
```

**Result:**
```
Forwarding: https://raucous-kyler-manageable.ngrok-free.dev -> http://localhost:5173
```

### 4. Open on Phone
Open the ngrok URL on your phone browser:
```
https://raucous-kyler-manageable.ngrok-free.dev
```

---

## 🔴 Problems Encountered

### Problem 1: ERR_NGROK_3200 - Tunnel Offline

**Error Message:**
```
ERR_NGROK_3200
Tunnel <id> not found
```

**Cause:** 
- Started ngrok before starting frontend
- ngrok tried to connect to `localhost:5173`, but nothing was running there

**Solution:**
Start services in correct order:
1. ✅ Start frontend first (`npm run dev`)
2. ✅ Then start ngrok (`.\ngrok http 5173`)

---

### Problem 2: Vite Host Header Blocking

**Error Message:**
```
Blocked request. This host ("raucous-kyler-manageable.ngrok-free.dev") is not allowed.
To allow this host, add "raucous-kyler-manageable.ngrok-free.dev" to `server.allowedHosts`
```

**Cause:**
Vite security feature blocks requests from unknown hosts to prevent DNS rebinding attacks.

**Solution:**
Add to `vite.config.ts`:
```typescript
server: {
  host: true,
  allowedHosts: ['.ngrok-free.dev', '.ngrok.io']
}
```

**Explanation:**
- `host: true` - Allows binding to all network interfaces
- `allowedHosts` - Whitelists ngrok domains (wildcard: `.ngrok-free.dev` matches any subdomain)

---

### Problem 3: WebSocket Connection Failed (Disconnected)

**Error in Console:**
```
WebSocket connection to 'ws://localhost:8080' failed
```

**Cause:**
Frontend was trying to connect to `localhost:8080` from the phone, but:
- `localhost` on phone = the phone itself (not the laptop!)
- Backend is running on laptop, not phone

**Solution 1 (Attempted): Two ngrok Tunnels**
```
Tunnel 1: Frontend (5173) → https://abc.ngrok-free.dev
Tunnel 2: Backend (8080) → https://xyz.ngrok-free.dev
```

**Problem with Solution 1:**
Free ngrok accounts only allow **1 active tunnel** at a time!

**Error:**
```
ERR_NGROK_334
The endpoint 'https://raucous-kyler-manageable.ngrok-free.dev' is already online.
Either:
1. stop your existing endpoint first, or
2. start both endpoints with '--pooling-enabled'
```

**Final Solution: Vite Proxy**

Route WebSocket through the same ngrok tunnel as frontend:

```typescript
// vite.config.ts
proxy: {
  '/ws': {
    target: 'ws://localhost:8080',
    ws: true
  }
}
```

**How it works:**
```
Phone → https://xyz.ngrok-free.dev/ws 
      ↓ ngrok tunnel
Laptop Vite (5173) → proxy request
      ↓
Backend (8080) → WebSocket connection established
```

**Benefits:**
- ✅ Only 1 ngrok tunnel needed (free tier compatible)
- ✅ WebSocket traffic routes through Vite proxy
- ✅ Works seamlessly on both local and remote access

---

### Problem 4: Wrong WebSocket Protocol

**Initial Code:**
```typescript
const WS_URL = 'ws://localhost:8080'
```

**Issue:**
- Local: `ws://` works (unencrypted)
- ngrok: Uses HTTPS, needs `wss://` (secure WebSocket)

**Solution:**
Auto-detect protocol based on page protocol:
```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
return `${protocol}//${window.location.host}/ws`
```

**Logic:**
- HTTP page → `ws://` (unencrypted)
- HTTPS page (ngrok) → `wss://` (encrypted)

---

## 🏗️ Architecture Explanation

### Local Development (Laptop Only)

```
┌─────────────────────────────────────────┐
│           LAPTOP                        │
│                                         │
│  Frontend (localhost:5173)              │
│      ↓ WebSocket                        │
│  Backend (localhost:8080)               │
│                                         │
│  Browser opens: localhost:5173          │
└─────────────────────────────────────────┘
```

**WebSocket URL:** `ws://localhost:8080` (direct)

---

### Remote Access (Phone via ngrok)

```
┌──────────────────┐
│   PHONE          │
│                  │
│  Browser opens:  │
│  https://xyz.    │
│  ngrok-free.dev  │
└────────┬─────────┘
         │
         ↓ Internet
         │
┌────────▼─────────────────────────────────┐
│   ngrok Tunnel                           │
│   (Cloud relay)                          │
└────────┬─────────────────────────────────┘
         │
         ↓ Tunnel to laptop
         │
┌────────▼─────────────────────────────────┐
│   LAPTOP                                 │
│                                          │
│   Vite Dev Server (5173)                 │
│   ├─ Serves HTML/CSS/JS                  │
│   └─ Proxy: /ws → localhost:8080         │
│                    ↓                     │
│   Backend (8080) ←─┘                     │
│   └─ WebSocket server                    │
└──────────────────────────────────────────┘
```

**Request Flow:**

1. **Phone browser:** `GET https://xyz.ngrok-free.dev/`
   - ngrok → Vite (5173) → Returns React app

2. **Phone browser:** `CONNECT wss://xyz.ngrok-free.dev/ws`
   - ngrok → Vite proxy → Backend (8080)
   - WebSocket established!

3. **Data flow:** Arduino → Backend → WebSocket → Vite proxy → ngrok → Phone
4. **Commands:** Phone → ngrok → Vite proxy → Backend → Arduino

---

## 🔧 Technical Details

### Why Proxy is Necessary

**Without Proxy (2 tunnels needed):**
```
Frontend: https://abc.ngrok-free.dev
Backend:  https://xyz.ngrok-free.dev
❌ Free ngrok = only 1 tunnel allowed
```

**With Proxy (1 tunnel sufficient):**
```
Everything: https://abc.ngrok-free.dev
  ├─ /             → Frontend (React)
  └─ /ws           → Backend (WebSocket via proxy)
✅ Free ngrok = works!
```

### Vite Proxy Configuration

```typescript
proxy: {
  '/ws': {
    target: 'ws://localhost:8080',  // Where to forward requests
    ws: true                         // Enable WebSocket proxying
  }
}
```

**What happens:**
1. Request arrives: `wss://xyz.ngrok-free.dev/ws`
2. Vite sees path starts with `/ws`
3. Vite forwards to `ws://localhost:8080`
4. Response streams back through same tunnel

### Protocol Conversion

| Location | Page Protocol | WebSocket Protocol | URL |
|----------|---------------|-------------------|-----|
| Laptop | HTTP | WS | `ws://localhost:8080` |
| Phone (ngrok) | HTTPS | WSS | `wss://xyz.ngrok-free.dev/ws` |

**Why WSS for ngrok:**
- ngrok uses HTTPS for security
- HTTPS pages must use WSS (encrypted WebSocket)
- HTTP pages can use WS (unencrypted)

---

## 🎯 Testing Checklist

### ✅ Local Testing (Laptop)
1. Start backend: `npm start`
2. Start frontend: `npm run dev`
3. Open: `http://localhost:5173`
4. **Should see:** Connected, live data

### ✅ Remote Testing (Phone - Same WiFi)
1. Find laptop IP: `ipconfig` → `192.168.1.x`
2. On phone: `http://192.168.1.x:5173`
3. **Should see:** Connected, live data

### ✅ Remote Testing (Phone - Different Network via ngrok)
1. Start backend: `npm start`
2. Start frontend: `npm run dev`
3. Start ngrok: `.\ngrok http 5173`
4. Copy ngrok URL: `https://xyz.ngrok-free.dev`
5. Open on phone
6. **Should see:** Connected, live data

### 🔍 Troubleshooting Commands

**Check if services are running:**
```powershell
# Backend
netstat -ano | findstr :8080

# Frontend
netstat -ano | findstr :5173
```

**Check WebSocket in browser console:**
```javascript
// Should see:
✅ WebSocket connected
📥 Received: {type: 'sensor_data', data: {...}}
```

---

## 📊 Comparison: Different Access Methods

| Method | Setup Complexity | Works Different Networks? | Cost | Speed |
|--------|-----------------|--------------------------|------|-------|
| **localhost** | 🟢 Easy | ❌ No | Free | ⚡ Fast |
| **Same WiFi (laptop IP)** | 🟢 Easy | ❌ No | Free | ⚡ Fast |
| **ngrok Free** | 🟡 Medium | ✅ Yes | Free | 🐌 Slower (relay) |
| **ngrok Pro** | 🟡 Medium | ✅ Yes | $8/month | 🐌 Slower (relay) |
| **Deploy to Cloud** | 🔴 Hard | ✅ Yes | Free-$5/month | ⚡ Fast |

---

## 🎓 Key Learnings

### 1. Network Topology
- `localhost` only works on same device
- IP addresses (192.168.x.x) only work on same network
- Cloud tunnels (ngrok) work across any network

### 2. Security Considerations
- Vite blocks unknown hosts (DNS rebinding protection)
- HTTPS requires WSS for WebSocket
- ngrok exposes local server publicly (temporary URLs)

### 3. Development vs Production
- **Development:** Use localhost or same WiFi
- **Demo:** Use ngrok for temporary sharing
- **Production:** Deploy to cloud (Vercel, AWS, etc.)

### 4. Free Tier Limitations
- ngrok Free: 1 concurrent tunnel
- Solution: Use proxy to route multiple services through 1 tunnel

---

## 🚀 Alternative Solutions

### Option 1: Both on Same WiFi (Simplest)
**No ngrok needed!**

Find laptop IP:
```powershell
ipconfig  # Look for: 192.168.1.105
```

Access from phone:
```
http://192.168.1.105:5173
```

**Pros:** Simple, fast, no external services  
**Cons:** Only works on same network

---

### Option 2: ngrok with Proxy (Current Solution)
**1 ngrok tunnel, proxy for WebSocket**

**Pros:** Works across networks, free  
**Cons:** Slower (relay), temporary URLs

---

### Option 3: ngrok Pro (Paid)
**Multiple tunnels, custom domains**

```powershell
.\ngrok http 5173 --domain=mydashboard.ngrok.app
.\ngrok http 8080 --domain=mybackend.ngrok.app
```

**Pros:** Persistent URLs, multiple tunnels  
**Cons:** $8/month

---

### Option 4: Deploy to Cloud (Production)
**Frontend: Vercel, Backend: Heroku/Railway**

**Pros:** Always available, fast, professional  
**Cons:** More setup, may cost money

---

## 📝 Summary

### What We Built
- ✅ Mobile access to React dashboard
- ✅ WebSocket working across networks
- ✅ Single ngrok tunnel (free tier compatible)
- ✅ Auto-detection of local vs remote access

### Key Files Changed
1. `vite.config.ts` - Added proxy, host settings
2. `useWebSocket.ts` - Auto-detect WebSocket URL
3. `.env` - Optional manual override

### Problems Solved
1. ❌ Host header blocking → ✅ Added allowedHosts
2. ❌ ERR_NGROK_3200 → ✅ Start frontend before ngrok
3. ❌ 2 tunnels needed → ✅ Proxy solution
4. ❌ WS vs WSS protocol → ✅ Auto-detection

### Final Architecture
```
Phone → ngrok tunnel → Vite proxy → Backend WebSocket
```

**Result:** Full mobile access with 1 free ngrok tunnel! 🎉

---

## 🔗 Useful Links

- ngrok Documentation: https://ngrok.com/docs
- Vite Proxy Config: https://vitejs.dev/config/server-options.html#server-proxy
- WebSocket Protocol: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

**Made with ❤️ by your Smart Home IoT System**
