# Smart Home Backend

Node.js backend server for the Smart Home IoT monitoring system.

## Features

- **Serial Communication**: Reads data from Arduino via USB Serial port
- **WebSocket Server**: Broadcasts live sensor data to frontend clients
- **REST API**: Provides endpoints for historical data and sending commands
- **Database Integration**: Stores sensor readings in PostgreSQL

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
copy .env.example .env
```

Edit `.env` and set:
- `SERIAL_PORT`: Your Arduino's COM port (e.g., COM3, COM4)
- `DB_PASSWORD`: Your PostgreSQL password

### 3. Find Arduino COM Port

To find which COM port your Arduino is connected to:

```bash
node -e "const {SerialPort} = require('serialport'); SerialPort.list().then(ports => ports.forEach(p => console.log(p.path)));"
```

### 4. Setup Database

Make sure PostgreSQL is installed and running, then create the database:

```sql
CREATE DATABASE smart_home;
```

Run the schema from `../database/schema.sql`

### 5. Start Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### GET /api/latest
Get the most recent sensor reading

### GET /api/history?limit=100
Get historical sensor readings (default limit: 100)

### POST /api/command
Send command to Arduino
```json
{
  "command": "MODE:MANUAL;LED:1;FAN:200"
}
```

## WebSocket

Connect to `ws://localhost:8080` to receive live sensor data:

```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data); // { temperature, humidity, led_status, fan_speed, control_mode }
};
```

## Architecture

```
Arduino (Serial USB) → SerialTransport → DatabaseService
                                      ↓
                              WebSocketService → Frontend Clients
```

## Troubleshooting

**Serial port not found:**
- Check Arduino is connected via USB
- Verify COM port in Device Manager (Windows)
- Update `SERIAL_PORT` in `.env`

**Database connection error:**
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify database exists

**WebSocket not connecting:**
- Check `WS_PORT` is not in use
- Verify no firewall blocking the port
