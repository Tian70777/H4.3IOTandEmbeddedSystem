# System Architecture Diagram

## 🏗️ Simple System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    SMART HOME IOT SYSTEM                          │
└──────────────────────────────────────────────────────────────────┘


    📟 ARDUINO                🌐 MQTT BROKER           💻 BACKEND
   (Hardware)              (broker.hivemq.com)        (Node.js)
  
  ┌─────────────┐                                   ┌──────────────┐
  │  DHT22      │                                   │   index.js   │
  │  LED        │           Publish/Subscribe       │  (Main       │
  │  Fan        │  ◄──────────────────────────────► │   Server)    │
  │  LCD        │                                   │              │
  │  Touch Btn  │                                   └──────┬───────┘
  └─────────────┘                                          │
                                                           │
       Topics:                                             │
       📤 home/arduino/sensors    (Arduino → Backend)      │
       📥 home/arduino/control    (Backend → Arduino)      │
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  PostgreSQL  │
                                                    │   Database   │
                                                    └──────────────┘
                                                           │
                                                           │
                         WebSocket                         │ HTTP REST
                         (Real-time)                       │ (History)
                              │                            │
                              └────────┬───────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │   FRONTEND     │
                              │  (React App)   │
                              │                │
                              │  📊 Dashboard  │
                              │  🎛️ Controls   │
                              │  📈 Graphs     │
                              └────────────────┘
```

## 📤 Data Flow: Arduino → Frontend

**Step-by-step:**

```
1️⃣  ARDUINO READS SENSORS (Every 2 seconds)
    ┌──────────────────────────────────────────────┐
    │  DHT22 sensor: 25.5°C, 60%                  │
    │  LED status: ON                              │
    │  Fan speed: 150                              │
    └──────────────────────────────────────────────┘
                      │
                      ▼
2️⃣  ARDUINO PUBLISHES TO MQTT
    ┌──────────────────────────────────────────────┐
    │  Topic: "home/arduino/sensors"              │
    │  Payload: {"temperature":"25.5",            │
    │            "humidity":"60",                  │
    │            "led":"1","fan":"150"}            │
    └──────────────────────────────────────────────┘
                      │
                      ▼
3️⃣  MQTT BROKER DELIVERS TO BACKEND
    ┌──────────────────────────────────────────────┐
    │  Backend subscribed to topic                │
    │  MqttTransport.js receives message          │
    └──────────────────────────────────────────────┘
                      │
                      ▼
4️⃣  BACKEND PROCESSES DATA
    ┌──────────────────────────────────────────────┐
    │  Parse JSON → Transform to standard format  │
    │  Call callback: this.onDataCallback(data)   │
    └──────────────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
5️⃣  SAVE TO DB              BROADCAST TO FRONTEND
    ┌──────────────┐         ┌────────────────────┐
    │ PostgreSQL   │         │ WebSocket          │
    │ INSERT       │         │ Send to all        │
    │ sensor_      │         │ connected clients  │
    │ readings     │         └────────┬───────────┘
    └──────────────┘                  │
                                      ▼
6️⃣  FRONTEND RECEIVES & DISPLAYS
    ┌──────────────────────────────────────────────┐
    │  React updates state                        │
    │  📊 Cards show: 25.5°C, 60%, LED ON         │
    │  📈 Live graphs add new data point          │
    └──────────────────────────────────────────────┘

    ⏱️  Total time: < 100ms
```

## Command Flow Diagram

```
┌──────────────┐
│  Dashboard   │  User clicks "MANUAL Mode" or adjusts controls
│  (Frontend)  │
└──────┬───────┘
       │
       │ HTTP POST to /api/control/manual
       │ Body: { "led": 1, "fan": 200 }
       │
       ▼
┌────────────────────────────────────────┐
│  Backend - REST API                    │
│  • Receives HTTP POST request          │
│  • Validates parameters                │
│  • Builds command string:              │
│    "MODE:MANUAL;LED:1;FAN:200"         │
│  • Calls transport.sendCommand()       │
└──────┬─────────────────────────────────┘
       │
       │ Command string
       │
       ▼
┌────────────────────────────────────────┐
│  Backend - SerialTransport             │
│  • Appends newline: "...\n"            │
│  • Writes to Serial port               │
└──────┬─────────────────────────────────┘
       │
       │ Serial USB transmission
       │
       ▼
┌────────────────────────────────────────┐
│  Arduino                               │
│  • Receives via Serial.available()     │
│  • Calls handleCommand()               │
│  • Parses command parts                │
│  • Sets controlMode = MANUAL           │
│  • Sets manualLedOn = true             │
│  • Sets manualFanSpeed = 200           │
│  • Applies to hardware:                │
│    - digitalWrite(LED_PIN, HIGH)       │
│    - analogWrite(FAN_PIN, 200)         │
└────────────────────────────────────────┘
       │
       │ Next data send cycle (2 sec)
       │
       ▼
    Sends updated status back to backend
```

## 🔌 Communication Protocols

### 3 Different Communication Methods:

```
┌────────────────────────────────────────────────────────────┐
│  1️⃣  MQTT (Arduino ↔ Backend)                             │
├────────────────────────────────────────────────────────────┤
│  Purpose:  Arduino sends data, receives commands          │
│  Protocol: MQTT (Message Queue Telemetry Transport)       │
│  Broker:   broker.hivemq.com:1883                         │
│  Topics:   • home/arduino/sensors   (Arduino publishes)   │
│            • home/arduino/control   (Arduino subscribes)  │
│  QoS:      1 (guaranteed delivery)                        │
│  Library:  PubSubClient (Arduino)                         │
│            mqtt (Node.js)                                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  2️⃣  WebSocket (Backend ↔ Frontend)                       │
├────────────────────────────────────────────────────────────┤
│  Purpose:  Real-time bidirectional communication          │
│  Protocol: WebSocket (ws://)                              │
│  Port:     8080                                           │
│  Use:      • Backend → Frontend: Sensor data broadcasts   │
│            • Frontend → Backend: Control commands         │
│  Library:  ws (Node.js)                                   │
│            Native WebSocket API (Browser)                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  3️⃣  HTTP REST (Frontend ↔ Backend)                       │
├────────────────────────────────────────────────────────────┤
│  Purpose:  Database queries (history, statistics)         │
│  Protocol: HTTP                                           │
│  Port:     3000                                           │
│  Endpoints:                                               │
│    • GET  /api/history         (Historical data)          │
│    • GET  /api/statistics      (Min/max/avg)              │
│    • POST /api/control/mode    (Set AUTO/MANUAL)          │
│    • POST /api/control/manual  (Manual controls)          │
│  Library:  Express (Node.js)                              │
│            Fetch API (Browser)                            │
└────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

```
Layer          | Technology                  | Purpose
───────────────┼─────────────────────────────┼──────────────────────
🔧 HARDWARE    | Arduino R4 WiFi             | Microcontroller
               | DHT22                       | Temp & Humidity sensor
               | LED, Fan, LCD, Touch button | Actuators & I/O
───────────────┼─────────────────────────────┼──────────────────────
📡 ARDUINO     | C++ / Arduino               | Firmware language
               | WiFiS3                      | WiFi connectivity
               | PubSubClient                | MQTT client
               | DHT, LiquidCrystal_I2C      | Sensor libraries
───────────────┼─────────────────────────────┼──────────────────────
☁️  MQTT       | broker.hivemq.com           | Free public MQTT broker
               | Port 1883                   | Standard MQTT port
───────────────┼─────────────────────────────┼──────────────────────
⚙️  BACKEND    | Node.js 16+                 | Runtime
               | Express.js                  | HTTP server
               | ws (v8.14.0)                | WebSocket server
               | mqtt (v5.3.0)               | MQTT client
               | pg (v8.11.0)                | PostgreSQL client
───────────────┼─────────────────────────────┼──────────────────────
💾 DATABASE    | PostgreSQL 15+              | Data storage
               | sensor_readings table       | Main data table
───────────────┼─────────────────────────────┼──────────────────────
🌐 FRONTEND    | React 18.2.0                | UI framework
               | TypeScript                  | Type-safe JS
               | Vite 5.4.21                 | Build tool
               | Three.js                    | 3D visualizations
               | Canvas API                  | Live waveform graphs
───────────────┴─────────────────────────────┴──────────────────────
```

## 📂 Key Files

```
📁 arduino/smart_home_main/
   ├── smart_home_main.ino   (Main Arduino code - 560 lines)
   ├── config.h              (WiFi & MQTT settings)
   ├── wifi_helper.h         (WiFi connection functions)
   └── mqtt_helper.h         (MQTT helper functions)

📁 backend/src/
   ├── index.js              (Main server - registers callbacks)
   ├── transports/
   │   ├── BaseTransport.js  (Parent class with onData method)
   │   └── MqttTransport.js  (MQTT communication)
   ├── services/
   │   ├── WebSocketService.js  (Real-time to frontend)
   │   └── DatabaseService.js   (PostgreSQL operations)
   └── api/
       └── routes.js         (HTTP REST endpoints)

📁 frontend/src/
   ├── main.tsx              (App entry point)
   ├── App.tsx               (Main layout)
   ├── hooks/
   │   └── useWebSocket.ts   (WebSocket connection hook)
   └── components/
       ├── SensorCard.tsx    (Display temp/humidity/etc)
       ├── ControlPanel.tsx  (Buttons & sliders)
       ├── LiveGraphs.tsx    (Waveform oscilloscope)
       └── HistoricalAnalysis.tsx  (Charts & statistics)

📁 database/
   └── schema.sql            (PostgreSQL table definitions)
```

## 🔢 Ports & Connections

```
Port 1883  : MQTT Broker (broker.hivemq.com)
Port 3000  : Backend HTTP REST API
Port 8080  : Backend WebSocket Server
Port 5432  : PostgreSQL Database
```

## ⚡ System Performance

```
⏱️  Data Flow Speed:
    • Arduino → MQTT Broker:        ~50ms
    • MQTT Broker → Backend:        ~50ms
    • Backend → Frontend:           ~10ms
    • Total end-to-end latency:     <200ms

📊 Data Frequency:
    • Sensor readings:              Every 2 seconds
    • Database writes:              Every 2 seconds
    • WebSocket broadcasts:         Every 2 seconds
    • Throughput:                   30 readings/minute
                                   1,800 readings/hour
                                   43,200 readings/day

💾 Database Growth:
    • Per reading:                  ~1 KB
    • Per day:                      ~43 MB
    • Per month:                    ~1.3 GB
```

## 🎯 Key Features

```
✅ Real-time sensor monitoring (temperature, humidity)
✅ AUTO mode: Automatic LED & fan control based on humidity
✅ MANUAL mode: User controls LED & fan from dashboard
✅ Live waveform graphs (50-point rolling buffer)
✅ Historical data analysis with charts
✅ 3D visualizations (LED & fan models)
✅ Touch button to turn system on/off
✅ LCD display shows current readings
✅ PostgreSQL database stores all readings
✅ MQTT for reliable Arduino communication
✅ WebSocket for real-time frontend updates
✅ Responsive React dashboard with TypeScript
```

---

## 🔄 Callback Pattern (Core Architecture)

The system uses **callbacks** for event-driven communication:

```javascript
// Registration phase (at startup)
transport.onData((sensorData) => {
  db.saveReading(sensorData);        // Save to database
  wsService.broadcast('sensor_data', sensorData);  // Send to frontend
});

// Invocation phase (when Arduino sends data)
// Inside MqttTransport.js:
if (this.onDataCallback) {
  this.onDataCallback(transformedData);  // ← Calls function above
}
```

**Same pattern for commands:**

```javascript
// Registration (at startup)
wsService.onCommand((command) => {
  transport.sendCommand(command);  // Send to Arduino via MQTT
});

// Invocation (when frontend sends command)
// Inside WebSocketService.js:
if (this.onCommandReceived) {
  this.onCommandReceived(data.command);  // ← Calls function above
}
```

---

*Simple, clear architecture with MQTT for reliable IoT communication!* 🚀
