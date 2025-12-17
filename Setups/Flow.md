Time: 0ms
┌─────────────┐
│  Frontend   │ User clicks "LED ON" button
└──────┬──────┘
       │
       │ onClick handler executes
       │
       ↓
    fetch('/api/command', {
        method: 'POST',
        body: { mode: 'manual', led: true }
    })
       │
       ↓

Time: 10ms
┌──────▼──────────────┐
│  Backend REST API   │ Receives HTTP POST
└──────┬──────────────┘
       │
       │ app.post('/api/command', ...)
       │
       ↓
    await transport.sendCommand(command)
       │
       ↓

Time: 15ms
┌──────▼───────────────┐
│  Transport Adapter   │ SerialTransport.sendCommand()
└──────┬───────────────┘
       │
       │ port.write("MODE:MANUAL;LED:1;FAN:200\n")
       │
       ↓

Time: 20ms
┌──────▼──────┐
│  Arduino    │ Receives via Serial
└──────┬──────┘
       │
       │ parseCommand("MODE:MANUAL;LED:1;FAN:200")
       │ manualLedOn = true
       │
       ↓
    Next loop():
    digitalWrite(LEDPIN, HIGH) ← LED actually turns on!
       │
       │ Arduino reads sensors + hardware state
       │
       ↓
    Sends: {temp:23.4, hum:50, led:true, fan:200}
       │
       ↓

Time: 2020ms (next sensor reading)
┌──────▼──────────┐
│  Backend        │ onDataReceived()
└──────┬──────────┘
       │
       │ Save to DB
       │
       ↓
    broadcastToFrontends(data)
       │
       │ wss.clients.forEach(client => {
       │     client.send(JSON.stringify(data))
       │ })
       │
       ↓

Time: 2025ms
┌──────▼──────┐
│  Frontend   │ ws.onmessage fires
└──────┬──────┘
       │
       │ const data = JSON.parse(event.data)
       │ setSensorData(data)
       │
       ↓
    React re-renders
    LED indicator shows: 💡 ON ✅




┌─────────────┐
│   Arduino   │
└──────┬──────┘
       │
       │ 🔵 Serial Protocol (RS232/UART)
       │    9600 baud, 8N1
       │    Text: "Temp=23.4,Hum=50\n"
       │
       ↓
┌──────▼──────────────────────┐
│      Backend                │
│                             │
│  SerialPort.on('data')     │
│      ↓                      │
│  parseData()                │
│      ↓                      │
│  saveToDatabase()           │
│      ↓                      │
│  🟢 WebSocket Protocol      │
│     ws.send(JSON.stringify) │
└──────┬──────────────────────┘
       │
       │ 🟢 WebSocket Protocol (ws://)
       │    Binary/JSON
       │    {"temp":23.4,"hum":50}
       │
       ↓
┌──────▼──────┐
│  Frontend   │
│  (Browser)  │
└─────────────┘