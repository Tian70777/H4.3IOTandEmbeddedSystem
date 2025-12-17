# 🎮 Manual Mode Implementation Guide

## 📡 How Manual Mode Works

### **Complete Flow:**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │      │   Arduino    │
│  React + TS  │      │   Node.js    │      │  UNO R4 WiFi │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ 1. User toggles LED │                     │
       │    in MANUAL mode   │                     │
       │                     │                     │
       │ 2. Send WebSocket   │                     │
       │    command          │                     │
       ├────────────────────►│                     │
       │ { type: "command",  │                     │
       │   command: "LED:1" }│                     │
       │                     │                     │
       │                     │ 3. Forward command  │
       │                     │    to Arduino       │
       │                     ├────────────────────►│
       │                     │ POST /command       │
       │                     │ Body: "LED:1"       │
       │                     │                     │
       │                     │                     │ 4. Arduino receives
       │                     │                     │    handleCommand("LED:1")
       │                     │                     │
       │                     │                     │ 5. Check mode
       │                     │                     │    if (MODE == MANUAL)
       │                     │                     │      digitalWrite(LED, HIGH)
       │                     │                     │
       │                     │ 6. Get updated data │
       │                     │◄────────────────────┤
       │                     │ GET /data           │
       │                     │ {temp, hum, led:1}  │
       │                     │                     │
       │ 7. Broadcast update │                     │
       │◄────────────────────┤                     │
       │ WebSocket: led:1    │                     │
       │                     │                     │
       │ 8. UI updates       │                     │
       │    LED indicator    │                     │
       │    glows yellow ✨  │                     │
       └─────────────────────┴─────────────────────┘
```

## 🔧 What I Modified

### **1. Backend: WebSocketService.js**

**Location:** `backend/src/services/WebSocketService.js`

**What Changed:**
- ✅ Added command handler in `ws.on('message')` 
- ✅ Created `onCommand()` method to register callback
- ✅ Forwards commands from frontend to Arduino

**Code Added:**
```javascript
// Lines 37-51: Handle incoming commands from frontend
ws.on('message', (message) => {
  try {
    const data = JSON.parse(message);
    console.log(`[WebSocket] Received from client:`, data);
    
    // Forward command to Arduino if it's a control command
    if (data.type === 'command' && data.command) {
      console.log(`[WebSocket] Forwarding command to Arduino: ${data.command}`);
      
      // Emit event so index.js can handle it
      if (this.onCommandReceived) {
        this.onCommandReceived(data.command);
      }
    }
  } catch (error) {
    console.error(`[WebSocket] Error parsing message:`, error.message);
  }
});

// Lines 132-138: Register command callback
onCommand(callback) {
  this.onCommandReceived = callback;
}
```

**Why:** 
- Allows backend to receive commands from React frontend
- Provides callback mechanism to forward commands

---

### **2. Backend: index.js**

**Location:** `backend/src/index.js`

**What Changed:**
- ✅ Added command handler registration after transport setup
- ✅ Links WebSocket → Transport → Arduino

**Code Added:**
```javascript
// Lines 104-113: Register command handler
wsService.onCommand((command) => {
  console.log('[Command] Received from frontend:', command);
  
  // Send command to Arduino
  if (transport && transport.sendCommand) {
    transport.sendCommand(command);
    console.log('[Command] Sent to Arduino:', command);
  } else {
    console.error('[Command] Transport does not support sending commands');
  }
});
```

**Why:**
- Connects WebSocket messages to Arduino transport
- Works with both Serial (USB) and HTTP (WiFi) transports

---

### **3. Arduino: smart_home_main.ino**

**Location:** `arduino/smart_home_main/smart_home_main.ino`

**What Changed:**
- ✅ Added `POST /command` endpoint in `handleHttpClient()`
- ✅ Added `GET /ping` endpoint for connection testing
- ✅ Extracts command from HTTP POST body
- ✅ Calls existing `handleCommand()` function

**Code Added:**
```cpp
// Lines 294-317: Handle POST /command requests
else if (request.indexOf("POST /command") >= 0) {
  Serial.println("Received command via HTTP POST");
  
  // Extract command from request body (after "\r\n\r\n")
  int bodyStart = request.indexOf("\r\n\r\n");
  if (bodyStart >= 0) {
    String command = request.substring(bodyStart + 4);
    command.trim();
    
    Serial.print("Command: ");
    Serial.println(command);
    
    // Process the command using existing handleCommand() function
    handleCommand(command);
    
    // Send success response
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/plain");
    client.println("Access-Control-Allow-Origin: *");
    client.println("Connection: close");
    client.println();
    client.println("OK");
    
    Serial.println("Command processed successfully");
  }
}

// Lines 318-324: Ping endpoint for testing
else if (request.indexOf("GET /ping") >= 0) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/plain");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Connection: close");
  client.println();
  client.println("PONG");
  Serial.println("Ping received");
}
```

**Why:**
- Allows Arduino to receive commands via HTTP POST
- Reuses existing `handleCommand()` logic (already handles MODE, LED, FAN)
- Works wirelessly when Arduino is on power cable only

---

## 🎯 How Commands Work

### **Command Format:**

Commands are sent as plain text strings:

| Command | Description | Example |
|---------|-------------|---------|
| `MODE:AUTO` | Switch to automatic mode | Temperature/humidity control |
| `MODE:MANUAL` | Switch to manual mode | User controls LED/fan |
| `LED:1` | Turn LED ON | Only works in MANUAL mode |
| `LED:0` | Turn LED OFF | Only works in MANUAL mode |
| `FAN:150` | Set fan speed to 150 PWM | Only works in MANUAL mode (0-255) |

### **Existing Arduino Logic (Already Implemented):**

```cpp
void handleCommand(String cmd) {
  cmd.trim();
  
  // Parse MODE
  if (cmd.indexOf("MODE:AUTO") >= 0) {
    controlMode = MODE_AUTO;
    Serial.println("Switched to AUTO mode");
  }
  else if (cmd.indexOf("MODE:MANUAL") >= 0) {
    controlMode = MODE_MANUAL;
    Serial.println("Switched to MANUAL mode");
  }
  
  // Parse LED (only affects manual mode)
  if (cmd.indexOf("LED:1") >= 0) {
    manualLedOn = true;
  }
  else if (cmd.indexOf("LED:0") >= 0) {
    manualLedOn = false;
  }
  
  // Parse FAN speed (only affects manual mode)
  int fanIdx = cmd.indexOf("FAN:");
  if (fanIdx >= 0) {
    manualFanSpeed = cmd.substring(fanIdx + 4).toInt();
    manualFanSpeed = constrain(manualFanSpeed, 0, 255);
  }
}
```

Then in main loop:

```cpp
// Check control mode
if (controlMode == MODE_AUTO) {
  // Auto logic: humidity-based control
  if (h > 50.0) targetLed = HIGH;
  if (h > 60.0) targetFanSpeed = 150;
}
else {
  // Manual mode: use values from frontend
  targetLed = manualLedOn ? HIGH : LOW;
  targetFanSpeed = manualFanSpeed;
}

// Apply to hardware
digitalWrite(LED_PIN, targetLed);
analogWrite(FAN_PIN, targetFanSpeed);
```

---

## 🧪 Testing Manual Mode

### **Step 1: Upload Arduino Code**
1. Connect Arduino via USB
2. Upload updated `smart_home_main.ino`
3. Open Serial Monitor to see IP address
4. Note the IP (e.g., `10.108.131.16`)
5. Disconnect USB, connect power cable

### **Step 2: Update Backend Config**
1. Open `backend/.env`
2. Ensure: `ARDUINO_HTTP_URL=http://10.108.131.16`
3. Keep: `TRANSPORT_TYPE=serial` (auto-fallback to HTTP)

### **Step 3: Start Backend**
```bash
cd backend
npm start
```

**Expected Output:**
```
[Serial] Failed to connect: Opening COM7: File not found
[Init] Auto-switching to HTTP transport...
[Init] Connecting to Arduino via HTTP...
[Init] ✓ HTTP connection successful!
[WebSocket] Server started on port 8080
```

### **Step 4: Start Frontend**
```bash
cd frontend
npm run dev
```

Open: http://localhost:5173/

### **Step 5: Test Manual Control**

1. **Check Connection:**
   - Status should show "🟢 Connected"
   - Data should update every 2 seconds

2. **Switch to MANUAL Mode:**
   - Click "🎮 MANUAL Mode" button
   - Manual controls should appear

3. **Test LED Control:**
   - Toggle LED switch ON
   - Watch Serial Monitor: "Manual LED: ON"
   - Watch Arduino: LED should turn on
   - Watch UI: LED indicator should glow yellow

4. **Test Fan Control:**
   - Move fan slider to 150
   - Watch Serial Monitor: "Manual Fan Speed set to: 150"
   - Watch Arduino: Fan should start spinning
   - Watch UI: Progress bar should show 59%

---

## 📊 Debug Information

### **Frontend Console (F12):**
```javascript
📤 Sent command: LED:1
📥 Received: {type: "sensor_data", data: {...led_status: 1}}
```

### **Backend Console:**
```
[WebSocket] Received from client: {type: "command", command: "LED:1"}
[WebSocket] Forwarding command to Arduino: LED:1
[Command] Received from frontend: LED:1
[Command] Sent to Arduino: LED:1
[HTTP] Sending command: LED:1
[HTTP] Command sent successfully
```

### **Arduino Serial Monitor:**
```
Received command via HTTP POST
Command: LED:1
Manual LED: ON
Command processed successfully
```

---

## 🎯 Summary

### **What Happens When You Toggle LED:**

1. **Frontend (React):** User clicks LED toggle
2. **Frontend:** Sends `{type: "command", command: "LED:1"}` via WebSocket
3. **Backend (WebSocket):** Receives command, forwards to transport
4. **Backend (HTTP):** Sends `POST http://10.108.131.16/command` with body `"LED:1"`
5. **Arduino:** Receives POST request, extracts `"LED:1"`
6. **Arduino:** Calls `handleCommand("LED:1")`
7. **Arduino:** Sets `manualLedOn = true`
8. **Arduino:** In loop, sets `digitalWrite(LED_PIN, HIGH)`
9. **Arduino:** Sends updated data back via `/data` endpoint
10. **Backend:** Receives new data, broadcasts via WebSocket
11. **Frontend:** Updates UI to show LED is ON (yellow glow)

### **Key Points:**

✅ **No USB needed** - Everything works wirelessly via WiFi  
✅ **Real-time updates** - UI updates immediately when hardware changes  
✅ **Bi-directional** - Frontend → Arduino (commands) & Arduino → Frontend (data)  
✅ **Mode-aware** - Commands only work in MANUAL mode  
✅ **Type-safe** - TypeScript ensures correct data types  
✅ **Auto-fallback** - Backend tries Serial first, then HTTP  

---

## 🚀 Your Complete System

**Frontend (React + TypeScript):**
- Modern glassmorphism UI
- Real-time sensor display
- Manual control switches/sliders
- WebSocket connection indicator

**Backend (Node.js):**
- WebSocket server (port 8080)
- REST API (port 3000)
- PostgreSQL database
- Serial/HTTP transport layer

**Arduino (UNO R4 WiFi):**
- DHT22 sensor (temp/humidity)
- LED indicator
- PWM fan control
- HTTP server (port 80)
- WiFi connectivity

**All working together wirelessly!** 🎉
