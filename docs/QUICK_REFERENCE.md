# Quick Reference - Transport Switching

## Current Status
- ✅ **Serial Transport**: Working (COM7)
- ✅ **HTTP Transport**: Implemented, ready to test

---

## Switch to HTTP Transport

### Step 1: Upload Arduino Code
```
1. Open Arduino IDE
2. Open: arduino/smart_home_main/smart_home_main.ino
3. Upload to Arduino R4 WiFi
4. Wait for upload to complete
```

### Step 2: Get Arduino IP Address
```
Check Arduino Serial Monitor or LCD display:
"IP Address: 192.168.1.150" ← Note this down
```

### Step 3: Test HTTP Endpoint
```bash
# Open browser, visit:
http://192.168.1.150/data

# Should see JSON response:
{"temperature":23.9,"humidity":46.3,"led":0,"fan":0,"mode":"AUTO"}
```

### Step 4: Update .env
```env
# Change these lines in backend/.env:
TRANSPORT_TYPE=http
ARDUINO_HTTP_URL=http://192.168.1.150
```

### Step 5: Restart Backend
```bash
cd backend
npm start
```

✅ **Backend now using HTTP!**

---

## Switch to Serial Transport

### Step 1: Update .env
```env
# Change these lines in backend/.env:
TRANSPORT_TYPE=serial
SERIAL_PORT=COM7
```

### Step 2: Connect USB Cable
```
Connect Arduino to computer via USB cable
```

### Step 3: Restart Backend
```bash
cd backend
npm start
```

✅ **Backend now using Serial!**

---

## Test HTTP Endpoint (Before Switching)

```bash
# Update ARDUINO_IP in test-http.js first
cd backend
node test-http.js
```

This tests:
- GET /data endpoint
- POST /command endpoint
- Verifies Arduino responds correctly

---

## Quick Troubleshooting

### HTTP Not Working
```bash
# 1. Can you ping Arduino?
ping 192.168.1.150

# 2. Test in browser
http://192.168.1.150/data

# 3. Check Arduino WiFi connection
Open Arduino Serial Monitor
Look for: "WiFi Connected" and "IP Address: ..."

# 4. Same network?
Both laptop and Arduino must be on same WiFi
```

### Serial Not Working
```bash
# 1. Find Arduino COM port
cd backend
node find-port.js

# 2. Update .env with correct port
SERIAL_PORT=COM7  # or whatever find-port.js shows

# 3. Close Arduino Serial Monitor
Only one program can use COM port at a time
```

---

## Configuration File (.env)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_home
DB_USER=postgres
DB_PASSWORD=postgres

# ============================================
# TRANSPORT CONFIGURATION - Choose one:
# ============================================

# Option 1: Serial Transport (USB)
TRANSPORT_TYPE=serial
SERIAL_PORT=COM7
SERIAL_BAUD_RATE=9600

# Option 2: HTTP Transport (WiFi)
# TRANSPORT_TYPE=http
# ARDUINO_HTTP_URL=http://192.168.1.150
# HTTP_POLL_INTERVAL=2000

# Server Configuration
HTTP_PORT=3000
WS_PORT=8080

# Environment
NODE_ENV=development
```

**To switch:** Just comment/uncomment the transport section you want!

---

## Network Requirements

### Serial Transport
- ❌ **No network needed**
- ✅ USB cable required
- ✅ Works offline

### HTTP Transport
- ✅ **WiFi network required**
- ✅ Both devices on **same network**
- ❌ No USB cable needed
- ✅ Works wirelessly

---

## Commands Cheat Sheet

```bash
# Find Arduino COM port
cd backend
node find-port.js

# Test HTTP connection
node test-http.js

# Start backend
npm start

# Check backend logs
# Look for: "[Init] Connecting to Arduino via Serial..."
# Or: "[Init] Connecting to Arduino via HTTP..."

# View Arduino IP
# Open Arduino Serial Monitor (115200 baud)
# Look for: "IP Address: 192.168.1.150"
```

---

## Port Reference

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Arduino HTTP | 80 | HTTP | Arduino web server |
| Backend API | 3000 | HTTP | REST API endpoints |
| WebSocket | 8080 | WS | Real-time data streaming |
| PostgreSQL | 5432 | TCP | Database connection |
| Arduino Serial | COM7 | Serial | USB communication |

---

## When to Use Each

### Use Serial When:
- 🔧 Development and debugging
- 🖥️ Arduino is near computer
- ⚡ Need lowest latency
- 📵 No WiFi available
- 🔌 USB cable is acceptable

### Use HTTP When:
- 🚀 Production deployment
- 📡 Wireless operation needed
- 📍 Arduino placed far from computer
- 🌐 Multiple clients need access
- 🔍 Want browser-based monitoring

---

## Both Transports Active

**Good news:** Arduino runs both Serial AND HTTP simultaneously!

- Serial communication continues even in HTTP mode
- Can debug via Serial Monitor while using HTTP
- No need to choose on Arduino side - both always work
- Backend chooses which one to use (via .env)

---

## Next Steps

1. ✅ Upload new Arduino code (with HTTP server)
2. ✅ Note Arduino IP address
3. ✅ Test HTTP endpoint in browser
4. ✅ Run test-http.js script
5. ✅ Update .env to use HTTP
6. ✅ Restart backend
7. ✅ Verify data still flowing to database

**Questions?** Check `docs/HTTP_TRANSPORT_GUIDE.md` for detailed explanation!
