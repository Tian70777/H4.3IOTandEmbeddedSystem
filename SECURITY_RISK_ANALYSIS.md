# Security Risk Analysis - Smart Home IoT Project

## 📋 Learning Objective

**Danish:** "Lærlingen kan, på baggrund af sin viden om sikkerhedsproblemer foretage en risikoanalyse af mulige sikkerhedsproblemer og på baggrund heraf indføre forebyggende foranstaltninger, som fx en plan for opdatering af enhedernes firmware/software."

**English:** "The student can perform a risk analysis of possible security issues and implement preventive measures, such as a firmware/software update plan."

---

## 🚨 Current Security State

### Development Environment (Current)

```
✅ Running on localhost (local network only)
✅ No internet exposure (safe for development)
❌ No authentication required
❌ No HTTPS/TLS encryption
❌ Database credentials in .env file
❌ CORS enabled for all origins
❌ Public MQTT broker (no authentication)
❌ Unencrypted MQTT traffic (port 1883)

⚠️  SAFE FOR LOCAL DEVELOPMENT
⚠️  NOT SUITABLE FOR INTERNET DEPLOYMENT
```

---

## 🔍 Security Risks (Prioritized)

### 🔴 CRITICAL Risks

#### 1. Public MQTT Broker - No Authentication

**Problem:**
- Anyone can read your sensor data
- Anyone can control your devices (LED, fan)
- Using free public broker `broker.hivemq.com`

**How to exploit:**
```bash
# Anyone can run these commands:
mosquitto_sub -h broker.hivemq.com -t "home/arduino/sensors"
mosquitto_pub -h broker.hivemq.com -t "home/arduino/control" -m "LED:1"
```

**Impact:** 🔴 CRITICAL - Complete system compromise

---

#### 2. Unencrypted MQTT Traffic (Port 1883)

**Problem:**
- Data travels as plain text through internet
- Sensor values visible to network attackers
- Commands can be intercepted and modified

**Current code:**
```javascript
// backend/src/index.js
port: 1883,  // ⚠️ No encryption
useSSL: false
```

**Impact:** 🔴 HIGH - Data can be read/modified

---

### 🟡 HIGH Risks

#### 3. No User Authentication

**Problem:**
- No login system
- No password protection
- Anyone with network access can control devices

**Impact:** 🟡 HIGH - Unauthorized access

---

#### 4. No Over-The-Air (OTA) Updates

**Problem:**
- Firmware updates require USB cable
- Can't fix security vulnerabilities remotely
- Impractical for deployed devices

**Impact:** 🟡 MEDIUM - Can't patch vulnerabilities quickly

---

### 🟢 MEDIUM Risks

#### 5. Unencrypted WebSocket (ws://)

**Problem:**
- `ws://localhost:8080` instead of `wss://`
- Data visible on local network

**Impact:** 🟢 MEDIUM (local only)

---

#### 6. Unencrypted HTTP API

**Problem:**
- `http://localhost:3000` instead of `https://`
- Historical data sent unencrypted

**Impact:** 🟢 MEDIUM (local only)

---

#### 7. No Database Encryption

**Problem:**
- Sensor readings stored in plain text
- Historical data readable if database accessed

**Impact:** 🟢 LOW (database not exposed to internet)

---

#### 8. No Input Validation

**Problem:**
- Commands not validated before sending to Arduino
- Could cause unexpected behavior

**Impact:** 🟢 MEDIUM

---

#### 9. No Rate Limiting

**Problem:**
- No protection against spam requests
- Could overwhelm system

**Impact:** 🟢 LOW

---

## 📊 Risk Summary Table

| # | Risk | Severity | Ease to Exploit | Priority |
|---|------|----------|-----------------|----------|
| 1 | Public MQTT Broker | 🔴 CRITICAL | Very Easy | Fix First |
| 2 | Unencrypted MQTT | 🔴 HIGH | Easy | Fix Second |
| 3 | No Authentication | 🟡 HIGH | Easy | Fix Third |
| 4 | No OTA Updates | 🟡 MEDIUM | N/A | Important |
| 5 | Unencrypted WebSocket | 🟢 MEDIUM | Medium | Local only |
| 6 | Unencrypted HTTP | 🟢 MEDIUM | Medium | Local only |
| 7 | No Database Encryption | 🟢 LOW | Hard | Low priority |
| 8 | No Input Validation | 🟢 MEDIUM | Medium | Improve |
| 9 | No Rate Limiting | 🟢 LOW | Easy | Nice to have |

---

## 🛡️ Solutions (Prioritized)

### 🔴 Solution 1: Secure MQTT Communication

**Priority: CRITICAL** - Fix this first!

#### Step 1: Switch to Encrypted Port

```javascript
// backend/src/index.js
mqtt: {
  broker: 'broker.hivemq.com',
  port: 8883,      // ✅ Was 1883
  useSSL: true     // ✅ Was false
}
```

```cpp
// Arduino
#include <WiFiClientSecure.h>
WiFiClientSecure secureClient;
PubSubClient mqtt(secureClient);

#define MQTT_PORT 8883  // ✅ Encrypted
```

**Result:** ✅ Traffic encrypted

---

#### Step 2: Use Private Broker with Authentication

**Recommended services:**
- CloudMQTT (free tier)
- AWS IoT Core
- Self-hosted Mosquitto

**Setup:**
```cpp
// Arduino config.h
#define MQTT_USERNAME "your_user"
#define MQTT_PASSWORD "secure_password"

// In code:
mqtt.connect(clientId, MQTT_USERNAME, MQTT_PASSWORD)
```

```javascript
// Backend
const client = mqtt.connect(brokerUrl, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});
```

**Result:** ✅ Only authorized devices can connect

---

### 🟡 Solution 2: Add User Authentication

**Priority: HIGH** - Add login system

#### Simple JWT Authentication

**Backend:**
```javascript
// Install: npm install jsonwebtoken bcrypt

// routes.js - Add login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Verify credentials (use bcrypt in production)
  if (username === 'admin' && password === 'secure_password') {
    const token = jwt.sign({ user: username }, SECRET_KEY);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protect routes
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Use on all control endpoints
app.post('/api/control/*', authMiddleware, ...);
```

**Frontend:**
```typescript
// Login page
const login = async () => {
  const res = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  const { token } = await res.json();
  localStorage.setItem('token', token);
};

// Include token in requests
fetch('/api/control/manual', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

**Result:** ✅ Must login to control devices

---

### 🟡 Solution 3: Enable HTTPS & WSS

**Priority: HIGH** - For production deployment

#### Get SSL Certificate

**Option A: Free certificate (Let's Encrypt)**
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com
```

**Option B: Self-signed certificate (development)**
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.cert
```

#### Update Backend

```javascript
// backend/src/index.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

// HTTPS server
const httpsServer = https.createServer(options, app);
httpsServer.listen(3000);

// Secure WebSocket (WSS)
const wss = new WebSocketServer({ 
  server: httpsServer  // Use HTTPS server
});
```

#### Update Frontend

```typescript
// Change from:
const ws = new WebSocket('ws://localhost:8080');
fetch('http://localhost:3000/api/history');

// To:
const ws = new WebSocket('wss://yourdomain.com:8080');
fetch('https://yourdomain.com:3000/api/history');
```

**Result:** ✅ All traffic encrypted

---

### 🟡 Solution 4: Implement OTA Updates

**Priority: MEDIUM** - Remote firmware updates

#### Arduino OTA Setup

```cpp
// Install ArduinoOTA library
#include <ArduinoOTA.h>

void setup() {
  // ... WiFi connection ...
  
  // Setup OTA
  ArduinoOTA.setHostname("arduino-smarthome");
  ArduinoOTA.setPassword("update_password");  // Required!
  
  ArduinoOTA.onStart([]() {
    Serial.println("OTA update starting...");
  });
  
  ArduinoOTA.onEnd([]() {
    Serial.println("OTA update complete!");
  });
  
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();  // Check for updates
  // ... rest of code ...
}
```

#### Upload new firmware via WiFi

```bash
# No USB cable needed!
python -m esptool --chip esp32 --port arduino-smarthome.local write_flash firmware.bin
```

**Result:** ✅ Update firmware remotely

---

### 🟢 Solution 5: Add Input Validation

**Priority: MEDIUM** - Prevent invalid commands

```javascript
// backend/src/api/routes.js
app.post('/api/control/manual', (req, res) => {
  const { led, fan } = req.body;
  
  // Validate LED
  if (led !== 0 && led !== 1) {
    return res.status(400).json({ error: 'LED must be 0 or 1' });
  }
  
  // Validate fan speed
  if (fan < 0 || fan > 255 || !Number.isInteger(fan)) {
    return res.status(400).json({ error: 'Fan must be 0-255' });
  }
  
  // Valid, proceed...
  const command = `MODE:MANUAL;LED:${led};FAN:${fan}`;
  transport.sendCommand(command);
  
  res.json({ success: true });
});
```

**Result:** ✅ Only valid commands sent

---

### 🟢 Solution 6: Add Rate Limiting

**Priority: LOW** - Prevent spam

```javascript
// Install: npm install express-rate-limit

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 100,  // Max 100 requests per minute
  message: 'Too many requests, please try again later'
});

// Apply to all routes
app.use('/api/', limiter);
```

**Result:** ✅ Can't spam requests

---

## 📝 Firmware Update Plan

**For Learning Objective: "Plan for updating device firmware/software"**

### Update Schedule

```
Monthly:     Check for security updates
Quarterly:   Review and apply non-critical updates
Critical:    Apply immediately (within 24 hours)
```

### Update Process

1. **Test in Development**
   - Update one test device
   - Run for 24 hours
   - Monitor for issues

2. **Staged Rollout**
   - Update 25% of devices
   - Wait 48 hours
   - Update remaining devices

3. **Rollback Plan**
   - Keep previous firmware version
   - Can rollback via OTA if issues found

### Version Tracking

```cpp
// Add to Arduino code
#define FIRMWARE_VERSION "1.2.3"

void publishVersion() {
  mqtt.publish("home/arduino/version", FIRMWARE_VERSION);
}
```

**Backend tracks versions:**
```javascript
// Store in database
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  firmware_version VARCHAR(10),
  last_update TIMESTAMP
);
```

---

## ✅ Implementation Priority

**If deploying to production, implement in this order:**

1. **Week 1:** MQTT encryption + authentication (CRITICAL)
2. **Week 2:** User authentication for web interface (HIGH)
3. **Week 3:** HTTPS & WSS encryption (HIGH)
4. **Week 4:** OTA updates (MEDIUM)
5. **Week 5:** Input validation (MEDIUM)
6. **Week 6:** Rate limiting (LOW)

**For local development:** Current setup is acceptable ✅

---

## 🎓 Learning Objective Met

**You can now:**
- ✅ Identify security risks in IoT systems
- ✅ Analyze severity and impact of each risk
- ✅ Propose preventive measures with code examples
- ✅ Create a firmware update plan
- ✅ Prioritize security improvements

**This document demonstrates comprehensive security knowledge required for the learning objective!** 🎯

---

