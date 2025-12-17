# Smart Home IoT Monitoring System

Complete IoT system for monitoring and controlling home environment using Arduino R4 WiFi.

## 🎯 Project Overview

This project consists of:
- **Arduino R4 WiFi**: Hardware with DHT22 sensor, LED, fan, LCD display, touch button
- **Node.js Backend**: Serial communication, WebSocket server, REST API, PostgreSQL database
- **Web Dashboard**: Real-time monitoring and control interface

## 📁 Project Structure

```
IOTandEmbeddedSystem/
├── arduino/
│   └── smart_home_main/
│       └── smart_home_main.ino    # Arduino sketch
├── backend/
│   ├── src/
│   │   ├── index.js               # Main server entry point
│   │   ├── transports/            # Serial, HTTP, MQTT adapters
│   │   ├── services/              # WebSocket, Database services
│   │   └── api/                   # REST API routes
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── public/
│   │   └── index.html             # Web dashboard
│   └── README.md
├── database/
│   ├── schema.sql                 # PostgreSQL schema
│   └── README.md
└── Setups/
    └── ProgramStructure.md        # Complete documentation
```

## 🚀 Quick Start

### Phase 1: Arduino Setup ✅ COMPLETE

1. Open `arduino/smart_home_main/smart_home_main.ino` in Arduino IDE
2. Install required libraries:
   - WiFiS3
   - LiquidCrystal_I2C
   - DHT sensor library
3. Update WiFi credentials in the code
4. Upload to Arduino R4 WiFi
5. Open Serial Monitor (9600 baud) to verify data output

### Phase 2: Backend Setup ⏳ READY TO START

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Find Arduino COM Port**
   ```bash
   node -e "const {SerialPort} = require('serialport'); SerialPort.list().then(ports => ports.forEach(p => console.log(p.path)));"
   ```

3. **Setup Database** (see `database/README.md`)
   - Install PostgreSQL
   - Create database: `CREATE DATABASE smart_home;`
   - Run schema: `psql -U postgres -d smart_home -f ../database/schema.sql`

4. **Configure Environment**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and update:
   - `SERIAL_PORT=COM3` (your Arduino port)
   - `DB_PASSWORD=your_password`

5. **Start Backend**
   ```bash
   npm start
   ```

### Phase 3: Frontend Setup

1. Open `frontend/public/index.html` in a web browser
2. Dashboard will connect to backend automatically
3. Monitor live data and control the system

## 🔌 System Architecture

```
Arduino (Serial USB) → Backend (Node.js) → Database (PostgreSQL)
                            ↓
                       WebSocket Server
                            ↓
                       Frontend Dashboard
```

### Communication Flow

1. **Arduino → Backend**: Serial USB at 9600 baud
   - Format: `DATA:temp=23.4,hum=50,led=1,fan=150,mode=AUTO`

2. **Backend → Frontend**: WebSocket on port 8080
   - Real-time sensor data broadcast

3. **Frontend → Backend**: HTTP REST API on port 3000
   - POST commands to control Arduino

## 📊 Features

### Arduino Features
- ✅ DHT22 temperature & humidity sensor
- ✅ Automatic LED control (humidity > 45%)
- ✅ Automatic fan speed adjustment
- ✅ LCD display with live readings
- ✅ Touch button system on/off
- ✅ AUTO and MANUAL control modes
- ✅ Serial command handling

### Backend Features
- ✅ Serial port communication
- ✅ WebSocket live data broadcasting
- ✅ REST API for commands and history
- ✅ PostgreSQL database storage
- ✅ Transport adapter pattern (Serial/HTTP/MQTT ready)

### Frontend Features
- ✅ Real-time data display
- ✅ Connection status indicator
- ✅ Control mode switching (AUTO/MANUAL)
- ✅ Manual LED and fan control

## 🛠️ Development Tools

- **Arduino IDE**: Upload code to Arduino
- **VS Code**: Backend/frontend development
- **PostgreSQL + pgAdmin**: Database management
- **Postman**: API testing (optional)
- **Chrome DevTools**: Frontend debugging

## 📡 API Endpoints

- `GET /api/status` - Backend status
- `GET /api/latest` - Latest sensor reading
- `GET /api/history?limit=100` - Historical data
- `POST /api/command` - Send raw command
- `POST /api/control/mode` - Set AUTO/MANUAL mode
- `POST /api/control/manual` - Set manual controls

## 🔍 Troubleshooting

### Arduino Not Sending Data
- Check Serial Monitor for "DATA:" messages
- Verify DHT22 sensor connections
- Check WiFi connection (system works offline too)

### Backend Connection Error
- Verify Arduino COM port in `.env`
- Check PostgreSQL is running
- Ensure no other program is using the Serial port

### Frontend Not Updating
- Check WebSocket connection (green dot)
- Verify backend is running
- Open browser console for errors

## 📝 Next Steps

- [ ] Add data visualization charts
- [ ] Implement MQTT transport
- [ ] Create mobile app
- [ ] Add email/SMS notifications
- [ ] Deploy to cloud (optional)

## 🎓 Learning Resources

- Arduino Documentation: https://docs.arduino.cc/
- Node.js SerialPort: https://serialport.io/
- WebSocket Protocol: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- PostgreSQL Tutorial: https://www.postgresqltutorial.com/

## 📄 License

This is a school project for learning purposes.

## 👤 Author

Student project for H4 IoT and Embedded Systems course
Danmarks Tekniske Universitet (DTU)
