 Complete Architecture - See the Two Separate Layers (完整架构 - 看两个独立层)

┌─────────────────────────────────────────────────────────┐
│                     ARDUINO                             │
└───────────┬─────────────────────────────────────────────┘
            │
            │ ⚠️ LAYER 1: Arduino ↔ Backend
            │    (Choose ONE of these three options)
            │
    ┌───────┼───────────┬──────────────┐
    │       │           │              │
 Serial    HTTP       MQTT             │
  🔵       🔵         🔵              │
    │       │           │              │
    └───────┴───────────┴──────────────┘
            │
            ↓
┌───────────▼─────────────────────────────────────────────┐
│                    BACKEND                              │
│  (Understands: Serial + HTTP + MQTT)                    │
└───────────┬─────────────────────────────────────────────┘
            │
            │ ⚠️ LAYER 2: Backend ↔ Frontend
            │    (ALWAYS WebSocket - no choice!)
            │
        WebSocket 🟢
            │
            ↓
┌───────────▼─────────────────────────────────────────────┐
│                   FRONTEND (Browser)                    │
│  (Only understands: HTTP + WebSocket)                   │
└─────────────────────────────────────────────────────────┘


**Mode 1: Serial**
┌──────────┐   Serial   ┌──────────┐  WebSocket  ┌──────────┐
│ Arduino  │ ─────────> │ Backend  │ ─────────>  │ Frontend │
└──────────┘            └──────────┘             └──────────┘
                             ↑
                        Need WebSocket! ✅
**Serial Mode Architecture:**
Arduino ─[Serial USB]─> Backend ─[WebSocket]─> Frontend
         (9600 baud)            (ws:// push)

Does Frontend use Serial? ❌ NO
Does Frontend use WebSocket? ✅ YES

Why?
- Serial is USB protocol (物理USB协议)
- Browsers cannot access USB ports (浏览器无法访问USB)
- **Backend reads Serial, converts to WebSocket (后端读串口，转为WebSocket)**

**Mode 2: HTTP**
┌──────────┐    HTTP    ┌──────────┐  WebSocket  ┌──────────┐
│ Arduino  │ ─────────> │ Backend  │ ─────────>  │ Frontend │
└──────────┘            └──────────┘             └──────────┘
                             ↑
                        Need WebSocket! ✅
**HTTP Mode Architecture:**
Arduino ─[HTTP POST]─> Backend ─[WebSocket]─> Frontend
         (WiFi)                (ws:// push)

Does Frontend use HTTP? ⚠️ ONLY for commands
Does Frontend use WebSocket? ✅ YES for live data

Why?
- HTTP is **request-response** (HTTP是请求-响应)
- Frontend can't "listen" for Arduino's HTTP requests (前端无法"监听"Arduino的HTTP请求)
- Arduino posts TO backend, not TO frontend (Arduino发送给后端，不是前端)
- Backend uses WebSocket to push data to frontend (后端用WebSocket推送数据给前端)


**Mode 3: MQTT**
┌──────────┐    MQTT    ┌──────────┐  WebSocket  ┌──────────┐
│ Arduino  │ ─────────> │ Backend  │ ─────────>  │ Frontend │
└──────────┘            └──────────┘             └──────────┘
                             ↑
                        Need WebSocket! ✅
**MQTT Mode Architecture:**
Arduino ─[MQTT publish]─> Broker ─[MQTT subscribe]─> Backend ─[WebSocket]─> Frontend
         (WiFi)                                                (ws:// push)

Does Frontend use MQTT? ❌ NO
Does Frontend use WebSocket? ✅ YES

Why?
- MQTT is TCP-based IoT protocol (MQTT是基于TCP的物联网协议)
- Browsers don't have MQTT client libraries (浏览器没有MQTT客户端库)
- Even if they did, it's inefficient (即使有，也不高效)
- **Backend subscribes to MQTT, converts to WebSocket** (后端订阅MQTT，转为WebSocket)


**why?**
Because browsers have limitations! 
┌───────────────────────────────────────────────────────┐
│       What Browsers CAN Do (浏览器能做什么)          │
├───────────────────────────────────────────────────────┤
│ ✅ HTTP requests (fetch, XMLHttpRequest)             │
│ ✅ WebSocket connections                             │
│ ✅ JavaScript execution                              │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│      What Browsers CANNOT Do (浏览器不能做什么)       │
├───────────────────────────────────────────────────────┤
│ ❌ Read Serial ports (USB) - Security risk!          │
│ ❌ Connect to MQTT brokers directly - Wrong protocol!│
│ ❌ Receive live data via HTTP - No push mechanism!   │
└───────────────────────────────────────────────────────┘


**How does Backend receive data from Arduino?**
┌────────────────────────────────────────────────────────┐
│  How Backend Receives Data       │
├──────────────┬─────────────────────────────────────────┤
│ Serial Mode  │ serialPort.on('data', callback)        │
│              │ Backend LISTENS to USB port            │
│              │ (后端监听USB端口)                       │
├──────────────┼─────────────────────────────────────────┤
│ HTTP Mode    │ app.post('/api/data', callback)        │
│              │ Backend RECEIVES HTTP POST             │
│              │ (后端接收HTTP POST)                     │
├──────────────┼─────────────────────────────────────────┤
│ MQTT Mode    │ mqttClient.on('message', callback)     │
│              │ Backend SUBSCRIBES to MQTT topic       │
│              │ (后端订阅MQTT主题)                      │
└──────────────┴─────────────────────────────────────────┘

But ALL modes do THIS to send to Frontend:
所有模式都这样发送给前端:
    ↓
wss.clients.forEach(client => {
    client.send(JSON.stringify(data));  ← WebSocket!
});

**Serial Mode:**
T=0s:   Arduino reads sensor
T=0.01s: Arduino Serial.println("DATA:temp=23.4...")
T=0.02s: Backend serialPort.on('data') receives
T=0.03s: Backend wss.clients.forEach() broadcasts ← WebSocket!
T=0.04s: Frontend ws.onmessage receives ← WebSocket!
T=0.05s: Frontend updates UI ✅
**HTTP Mode:**
T=0s:   Arduino reads sensor
T=0.1s: Arduino HTTP POST to backend
T=0.2s: Backend app.post('/api/data') receives
T=0.3s: Backend wss.clients.forEach() broadcasts ← WebSocket!
T=0.4s: Frontend ws.onmessage receives ← WebSocket!
T=0.5s: Frontend updates UI ✅
**MQTT Mode:**
T=0s:   Arduino reads sensor
T=0.05s: Arduino mqtt.publish('sensors/home', data)
T=0.06s: MQTT Broker routes message
T=0.07s: Backend mqttClient.on('message') receives
T=0.08s: Backend wss.clients.forEach() broadcasts ← WebSocket!
T=0.09s: Frontend ws.onmessage receives ← WebSocket!
T=0.10s: Frontend updates UI ✅


┌───────────────────────────────────────────────────────┐
│          BACKEND'S JOB (后端的工作)                    │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Step 1: RECEIVE from Arduino (接收来自Arduino)        │
│          ├─ Serial? → serialPort.on('data')           │
│          ├─ HTTP? → app.post('/api/data')             │
│          └─ MQTT? → mqttClient.on('message')          │
│                                                       │
│  Step 2: PARSE the data (解析数据)                     │
│          Parse into JavaScript object                 │
│          { temp: 23.4, hum: 50 }                      │
│                                                       │
│  Step 3: CONVERT to WebSocket format (转换为WebSocket) │
│          const json = JSON.stringify(data);           │
│                                                       │
│  Step 4: BROADCAST to all Frontend clients (广播)     │
│          wss.clients.forEach(client => {              │
│              client.send(json);  ← WebSocket!         │
│          });                                          │
│                                                       │
└───────────────────────────────────────────────────────┘