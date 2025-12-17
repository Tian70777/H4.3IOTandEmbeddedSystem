# HTTP Transport Guide

## Overview
Your backend now supports **two transport methods** for communicating with Arduino:
1. **Serial** (USB cable) - Default, currently working
2. **HTTP** (WiFi) - New option, requires same network

## How It Works

### Serial Transport (Current)
- Arduino sends data via USB Serial (COM7)
- Backend reads from Serial port every 2 seconds
- **No network required** - just USB cable
- Works even if WiFi is disconnected

### HTTP Transport (New)
- Arduino runs HTTP server on port 80
- Backend polls Arduino IP address every 2 seconds
- **Requires same WiFi network** - both Arduino and laptop must be connected to the same network
- No USB cable needed - completely wireless

## Network Requirements for HTTP

**YES, Arduino and laptop MUST be on the same network** for HTTP to work:

1. **Same WiFi Network**: Both devices must connect to the same WiFi router
   - Arduino connects to: `TCH3WG15XG` or `prog`
   - Your laptop must connect to the same network
   
2. **Local Network Communication**: 
   - Arduino gets IP like `192.168.1.150`
   - Backend accesses `http://192.168.1.150/data`
   - This only works within the local network (LAN)

3. **Why Same Network?**
   - Local IP addresses (192.168.x.x) are private
   - Router isolates networks for security
   - Cannot access Arduino from different WiFi network

## Switching Between Transports

### Method 1: Manual Configuration (Recommended)

Edit your `.env` file:

```env
# For Serial (USB)
TRANSPORT_TYPE=serial
SERIAL_PORT=COM7
SERIAL_BAUD_RATE=9600

# For HTTP (WiFi)
# TRANSPORT_TYPE=http
# ARDUINO_HTTP_URL=http://192.168.1.150
# HTTP_POLL_INTERVAL=2000
```

To switch to HTTP:
1. Uncomment HTTP lines (remove `#`)
2. Comment Serial lines (add `#`)
3. Update Arduino IP address
4. Restart backend: `npm start`

### Method 2: Auto-Detection (Future Enhancement)

The backend could automatically try both:
```javascript
// Pseudocode for auto-detection
try {
  connectSerial()
} catch (error) {
  try {
    connectHttp()
  } catch (error) {
    console.error('No transport available')
  }
}
```

**Current Status**: Not implemented - must manually set `TRANSPORT_TYPE`

## Arduino HTTP Endpoints

Once Arduino is connected to WiFi, it exposes two endpoints:

### GET /data
Returns current sensor readings and actuator states.

**Request:**
```http
GET http://192.168.1.150/data
```

**Response:**
```json
{
  "temperature": 23.9,
  "humidity": 46.3,
  "led": 0,
  "fan": 0,
  "mode": "AUTO"
}
```

### POST /command
Sends control commands to Arduino (manual mode only).

**Request:**
```http
POST http://192.168.1.150/command
Content-Type: application/json

{
  "command": "set_mode",
  "mode": "MANUAL"
}
```

**Available Commands:**
```json
// Switch to AUTO mode
{"command": "set_mode", "mode": "AUTO"}

// Switch to MANUAL mode
{"command": "set_mode", "mode": "MANUAL"}

// Set LED (MANUAL mode only)
{"command": "set_led", "value": 1}  // 1=ON, 0=OFF

// Set Fan speed (MANUAL mode only)
{"command": "set_fan", "value": 128}  // 0-255
```

## How to Use HTTP Transport

### Step 1: Upload Arduino Code
Upload the updated `smart_home_main.ino` to your Arduino. The HTTP server starts automatically when WiFi connects.

### Step 2: Find Arduino IP Address
Check Arduino Serial Monitor or LCD display to see the IP address:
```
WiFi Connected
IP Address: 192.168.1.150
HTTP Server started on port 80
```

### Step 3: Update Backend Configuration
Edit `backend/.env`:
```env
TRANSPORT_TYPE=http
ARDUINO_HTTP_URL=http://192.168.1.150
HTTP_POLL_INTERVAL=2000
```

### Step 4: Test HTTP Connection
Open browser and visit: `http://192.168.1.150/data`

You should see JSON response with sensor data.

### Step 5: Restart Backend
```bash
cd backend
npm start
```

Backend will now poll Arduino via HTTP instead of Serial.

## Troubleshooting

### Arduino Not Responding
- Check Arduino is connected to WiFi (LCD shows IP)
- Verify Arduino IP hasn't changed (routers may reassign)
- Ping Arduino: `ping 192.168.1.150`
- Test endpoint in browser: `http://192.168.1.150/data`

### "Cannot connect to Arduino"
- Confirm laptop and Arduino on same WiFi
- Check firewall isn't blocking port 80
- Verify `ARDUINO_HTTP_URL` matches actual IP
- Arduino Serial Monitor shows: "HTTP Server started"

### Data Not Updating
- Check `HTTP_POLL_INTERVAL` (default 2000ms)
- Arduino Serial Monitor should show requests
- Browser refresh `http://192.168.1.150/data` to verify data changes

### Want to Switch Back to Serial
Edit `.env`:
```env
TRANSPORT_TYPE=serial
SERIAL_PORT=COM7
```
Restart backend.

## Advantages of Each Transport

### Serial (USB)
✅ **Pros:**
- Simple, reliable, no network needed
- Direct connection, no IP address issues
- Works in offline environments
- Lower latency

❌ **Cons:**
- Requires USB cable
- Arduino must be near computer
- Only one program can use COM port

### HTTP (WiFi)
✅ **Pros:**
- Wireless - no cables needed
- Can place Arduino anywhere in WiFi range
- Multiple clients can access simultaneously
- Arduino accessible from browser

❌ **Cons:**
- Requires WiFi connection
- Both devices must be on same network
- Slightly higher latency
- IP address may change

## Summary

**Can backend distinguish automatically?**
- Not currently - you must manually set `TRANSPORT_TYPE` in `.env`
- Could be implemented with fallback logic (try Serial, then HTTP)

**Do Arduino and laptop need same network for HTTP?**
- **YES** - Both must connect to same WiFi router
- Local IP addresses (192.168.x.x) only work within LAN
- Serial transport does NOT require network at all

**When to use each:**
- **Serial**: Development, debugging, no WiFi available
- **HTTP**: Production, wireless deployment, multiple clients
