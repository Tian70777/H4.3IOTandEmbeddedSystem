# Arduino MQTT Setup Guide

## 📦 What You Need to Install

### 1. Install PubSubClient Library

**In Arduino IDE:**
1. Go to **Tools** → **Manage Libraries**
2. Search for: `PubSubClient`
3. Find **"PubSubClient by Nick O'Leary"**
4. Click **Install**

OR

**Alternative method:**
1. Go to: https://github.com/knolleary/pubsubclient
2. Download ZIP
3. **Sketch** → **Include Library** → **Add .ZIP Library**

---

## ✅ What We Added to Your Code

### 1. MQTT Library Import
```cpp
#include <PubSubClient.h>  // MQTT library
```

### 2. MQTT Configuration
```cpp
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// Topics (must match backend .env!)
const char* mqtt_topic_sensor = "home/arduino/sensors";   // Arduino publishes here
const char* mqtt_topic_control = "home/arduino/control";  // Arduino listens here

// MQTT Client
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
```

### 3. MQTT Functions Added

**mqttCallback()** - Receives commands from backend
```cpp
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Converts MQTT message to command
  // Calls handleCommand() - same function for Serial/HTTP/MQTT!
}
```

**reconnectMQTT()** - Maintains connection to broker
```cpp
void reconnectMQTT() {
  // Connects to broker.hivemq.com
  // Subscribes to home/arduino/control
}
```

**publishSensorData()** - Sends sensor data to backend
```cpp
void publishSensorData(float temp, float hum, int led, int fan) {
  // Creates JSON: {"temperature":25.5,"humidity":60.2,"led":1,"fan":150,"mode":"AUTO"}
  // Publishes to home/arduino/sensors
}
```

### 4. Loop Updates
```cpp
// Added to loop():
if (currentMode == MODE_ONLINE) {
  if (!mqttClient.connected()) {
    reconnectMQTT();  // Reconnect if disconnected
  }
  
  if (mqttClient.connected()) {
    mqttClient.loop();  // Process incoming messages
    publishSensorData(t, h, targetLed, targetFanSpeed);  // Send data
  }
}
```

---

## 🚀 How to Upload

1. **Install PubSubClient library** (see above)
2. **Connect Arduino via USB**
3. **Select board**: Arduino UNO R4 WiFi
4. **Select port**: COM7 (or your port)
5. **Upload** the sketch
6. **Open Serial Monitor** (9600 baud)

---

## 📊 What You'll See in Serial Monitor

```
Connecting to Tian
....
Connected! IP: 10.108.131.16
HTTP server started on port 80
MQTT client configured
[MQTT] Attempting connection to broker.hivemq.com:1883
[MQTT] Connected successfully!
[MQTT] Subscribed to: home/arduino/control
Temp: 21.8 C  Hum: 46.2 %
[MQTT] Published sensor data
```

---

## 🎯 How Data Flows

### Arduino → Backend (Sensor Data)

```
Arduino loop() every 2 seconds
   ↓ calls
publishSensorData()
   ↓ creates JSON
{"temperature":21.8,"humidity":46.2,"led":1,"fan":0,"mode":"MANUAL"}
   ↓ publishes to
home/arduino/sensors (MQTT topic)
   ↓ MQTT Broker forwards to
Backend MqttTransport
   ↓ emits data event
index.js receives data
   ↓ saves to database + broadcasts
WebSocket → Frontend
   ↓
Dashboard updates! 🎉
```

### Frontend → Arduino (Commands)

```
User clicks LED button in dashboard
   ↓
Frontend sends {"type":"command","command":"LED:1"}
   ↓ via WebSocket
Backend index.js receives command
   ↓ calls
transport.sendCommand("LED:1")
   ↓ MqttTransport publishes to
home/arduino/control (MQTT topic)
   ↓ MQTT Broker forwards to
Arduino mqttCallback()
   ↓ calls
handleCommand("LED:1")
   ↓ sets
manualLedOn = true
   ↓ loop() applies
digitalWrite(LED_PIN, HIGH)
   ↓
LED turns ON! 💡
```

---

## 🔍 Troubleshooting

### Arduino Serial Shows: "MQTT Connection failed, rc=-2"

**Problem:** Can't reach MQTT broker

**Solutions:**
1. Check WiFi connected: `WiFi.status() == WL_CONNECTED`
2. Check internet access: Ping google.com from same network
3. Try different broker port: 1883, 8883
4. Check firewall blocking MQTT ports

### Arduino Serial Shows: "MQTT Publish failed"

**Problem:** Connected but can't send messages

**Solutions:**
1. Check message size < 128 bytes (PubSubClient limit)
2. Increase buffer: Add `mqttClient.setBufferSize(256);` in setup()
3. Check QoS level (default is 0)

### Backend Shows: "[MQTT] Subscribed" but No Data

**Problem:** Topic mismatch

**Solutions:**
1. Check Arduino publishes to: `home/arduino/sensors`
2. Check backend subscribes to: `home/arduino/sensors` (in .env)
3. Topics are case-sensitive!
4. No spaces allowed in topic names

### Commands from UI Don't Work

**Problem:** Arduino not receiving from control topic

**Solutions:**
1. Check Arduino subscribed: `[MQTT] Subscribed to: home/arduino/control`
2. Check backend publishes to: `home/arduino/control` (in .env)
3. Verify `mqttClient.loop()` is called in Arduino loop()
4. Test with HiveMQ web client first

---

## 🧪 Testing Steps

### 1. Test Arduino Connection
```
Serial Monitor should show:
✅ "Connected! IP: x.x.x.x"
✅ "[MQTT] Connected successfully!"
✅ "[MQTT] Subscribed to: home/arduino/control"
✅ "[MQTT] Published sensor data"
```

### 2. Test Backend Connection
```
Backend terminal should show:
✅ "[MQTT] Connecting to mqtt://broker.hivemq.com:1883..."
✅ "[MQTT] Connected to broker successfully"
✅ "[MQTT] Subscribed to topic: home/arduino/sensors"
✅ "[MQTT] Received sensor data: {...}"
```

### 3. Test Frontend Display
```
Open dashboard (localhost:5173)
✅ Connection status: "Connected"
✅ Sensor values updating every 2 seconds
✅ LED/Fan controls working in MANUAL mode
```

### 4. Test HiveMQ Web Client
```
Go to: http://www.hivemq.com/demos/websocket-client/

1. Connect to broker.hivemq.com:8000
2. Subscribe to: home/arduino/sensors
3. You should see JSON messages every 2 seconds!

4. Publish to: home/arduino/control
5. Message: LED:1
6. Arduino LED should turn on!
```

---

## 🌍 Testing from Different Networks

### Scenario: Arduino at Home, You at University

1. **Leave Arduino running at home** (power cable only, no USB)
2. **Go to university with laptop**
3. **Start backend** on laptop
4. **Open dashboard** on laptop
5. **IT WORKS!** Because MQTT broker is in the cloud ☁️

**Why?**
```
Arduino (home WiFi)
   ↓ internet connection
MQTT Broker (cloud in Germany)
   ↑ internet connection
Laptop Backend (university WiFi)
   ↓ WebSocket (local)
Frontend Dashboard
```

**Both connect to SAME cloud broker, so they can talk!** 🎉

---

## 🔒 Security Tips

**Current Setup (Learning):**
- Port 1883 (unencrypted)
- Public broker (anyone can subscribe)
- No authentication

**For Production:**
1. Use port 8883 (SSL/TLS)
2. Add unique topic prefix: `home/arduino/YOUR_RANDOM_ID/sensors`
3. Use private broker with authentication
4. Add username/password to MQTT client

---

## 📚 Summary

✅ **MQTT Library** - PubSubClient installed  
✅ **Topics Defined** - `home/arduino/sensors` and `home/arduino/control`  
✅ **Publish Function** - Sends sensor data every 2 seconds  
✅ **Subscribe Function** - Listens for commands from backend  
✅ **Callback Function** - Processes incoming commands  
✅ **Reconnection Logic** - Auto-reconnects if connection drops  
✅ **Same Command Handler** - Uses `handleCommand()` for all transports!  

**Result:** Arduino now supports **THREE** communication methods:
1. Serial (USB cable)
2. HTTP (WiFi local network)
3. MQTT (Cloud broker - works anywhere!)

**And backend/frontend DON'T NEED TO CHANGE!** That's the power of abstraction! 🚀
