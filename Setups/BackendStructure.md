**The Transport Adapter! (传输适配器!)**

// Backend structure
┌────────────────────────────────────────┐
│         BACKEND COMPONENTS             │
├────────────────────────────────────────┤
│                                        │
│  📡 REST API Layer                    │
│     └─ POST /api/command ← Frontend    │
│                                        │
│  🔌 Transport Adapter  │
│     ├─ SerialTransport.sendCommand()   │
│     ├─ HttpTransport.sendCommand()     │
│     └─ MqttTransport.sendCommand()     │
│                                        │
│  🌐 WebSocket Service                 │
│     └─ Broadcasts data to Frontend     │
│                                        │
│  💾 Database Service                  │
│     └─ Saves to PostgreSQL             │
└────────────────────────────────────────┘

