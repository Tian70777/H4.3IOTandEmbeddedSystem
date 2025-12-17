# Smart Home Frontend

Simple dashboard for monitoring and controlling the Smart Home system.

## Features

- **Live Data Display**: Real-time temperature, humidity, LED status, and fan speed
- **WebSocket Connection**: Receives live updates from backend
- **Control Panel**: Switch between AUTO and MANUAL modes
- **Manual Controls**: Toggle LED and adjust fan speed in MANUAL mode

## How to Use

### 1. Start Backend First

Make sure the backend is running:

```bash
cd backend
npm start
```

### 2. Open Dashboard

Simply open `index.html` in your web browser:

```
frontend/public/index.html
```

Or use a simple HTTP server:

```bash
cd frontend/public
python -m http.server 8000
```

Then visit: http://localhost:8000

## Features Explained

### Connection Status
- Green dot: Connected to backend WebSocket
- Red dot: Disconnected (will auto-reconnect)

### Sensor Cards
- **Temperature**: Current temperature in °C
- **Humidity**: Current humidity in %
- **LED Status**: ON or OFF
- **Fan Speed**: 0-255 PWM value

### Control Panel

**AUTO Mode** 🤖:
- Arduino controls everything automatically
- LED turns on when humidity > 45%
- Fan speed adjusts based on humidity ranges

**MANUAL Mode** 🎮:
- You control LED and fan manually
- Use toggle switch for LED
- Use slider for fan speed (0-255)

## API Endpoints Used

The frontend communicates with:

- **WebSocket**: `ws://localhost:8080` - Live data stream
- **REST API**: `http://localhost:3000/api/` - Commands

## Troubleshooting

**"Disconnected" status:**
- Check if backend is running
- Verify WebSocket port 8080 is not blocked
- Check browser console for errors

**Controls not working:**
- Ensure Arduino is connected
- Check backend terminal for errors
- Verify Serial port is correct in backend/.env

**No data showing:**
- Wait a few seconds for Arduino to send data
- Check Arduino Serial Monitor (should see DATA: messages)
- Verify backend is receiving data (check terminal logs)

## Browser Compatibility

Works best in modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Future Enhancements

- Historical data charts
- Temperature/humidity graphs
- Alert notifications
- Mobile responsive design
- Dark mode toggle
