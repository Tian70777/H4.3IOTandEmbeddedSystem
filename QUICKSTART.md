# 🚀 Quick Start Guide

Follow these steps to get your Smart Home system running!

## ✅ Prerequisites Checklist

- [ ] Arduino R4 WiFi with sensors connected
- [ ] USB cable to connect Arduino to laptop
- [ ] Node.js installed (v16 or higher)
- [ ] PostgreSQL installed
- [ ] Arduino IDE installed

## 📋 Step-by-Step Setup

### Step 1: Upload Arduino Code (5 minutes)

1. Open Arduino IDE
2. Open `arduino/smart_home_main/smart_home_main.ino`
3. Install libraries via Library Manager:
   - WiFiS3
   - DHT sensor library
   - LiquidCrystal I2C
4. Update WiFi credentials in code (lines 30-33)
5. Connect Arduino via USB
6. Select **Arduino UNO R4 WiFi** board
7. Select correct COM port
8. Click **Upload** ⬆️
9. Open Serial Monitor (9600 baud) - you should see:
   ```
   === Smart Home System Starting ===
   DATA:temp=23.4,hum=50,led=1,fan=150,mode=AUTO
   ```

✅ **Arduino is ready!**

---

### Step 2: Setup PostgreSQL Database (10 minutes)

1. Install PostgreSQL from: https://www.postgresql.org/download/windows/
2. Remember the password you set for `postgres` user!
3. Open **pgAdmin 4** or **psql**
4. Create database:
   ```sql
   CREATE DATABASE smart_home;
   ```
5. Run the schema:
   ```bash
   cd database
   psql -U postgres -d smart_home -f schema.sql
   ```
6. Verify table was created:
   ```sql
   \c smart_home
   \dt
   ```
   You should see `sensor_readings` table.

✅ **Database is ready!**

---

### Step 3: Setup Backend (10 minutes)

1. Open terminal in `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Find your Arduino COM port:
   ```bash
   node find-port.js
   ```
   Look for the port marked with ✅ (e.g., COM3)

4. Create `.env` file:
   ```bash
   copy .env.example .env
   ```

5. Edit `.env` file and update:
   ```
   SERIAL_PORT=COM3              # Your Arduino port from step 3
   DB_PASSWORD=your_postgres_password
   ```

6. Start the backend:
   ```bash
   npm start
   ```

You should see:
```
========================================
   Backend Ready!
========================================
REST API:   http://localhost:3000
WebSocket:  ws://localhost:8080
Serial:     COM3 @ 9600 baud
Database:   smart_home @ localhost
========================================

[Serial] Received: DATA:temp=23.4,hum=50,led=1,fan=150,mode=AUTO
[Database] Saved reading #1
[WebSocket] Broadcasted to 0 clients
```

✅ **Backend is running!**

---

### Step 4: Open Dashboard (2 minutes)

1. Open your web browser (Chrome recommended)
2. Open file: `frontend/public/index.html`
3. You should see:
   - Green connection indicator
   - Live temperature, humidity, LED status, fan speed
   - Control panel

✅ **Dashboard is live!**

---

## 🎮 Test the System

### Test AUTO Mode (Default)

The Arduino should automatically:
- Turn LED ON when humidity > 45%
- Adjust fan speed based on humidity

### Test MANUAL Mode

1. Click **🎮 MANUAL Mode** button
2. Toggle the LED switch
3. Adjust fan speed slider
4. Watch Arduino respond in real-time!

### Test Serial Communication

In Arduino Serial Monitor, type:
```
MODE:MANUAL;LED:1;FAN:200
```
Press Enter. LED should turn on, fan speed should change.

---

## 🔍 Troubleshooting

### Backend won't start

**Error: "Port COM3 not found"**
- Run `node find-port.js` to find correct port
- Update `SERIAL_PORT` in `.env`
- Make sure no other program (Arduino IDE Serial Monitor) is using the port

**Error: "Database connection failed"**
- Check PostgreSQL is running (Windows Services)
- Verify password in `.env`
- Make sure database `smart_home` exists

### Dashboard shows "Disconnected"

- Check backend is running
- Look for errors in browser console (F12)
- Verify ports 3000 and 8080 are not blocked

### No data showing

- Check Arduino Serial Monitor - should see `DATA:` messages every 2 seconds
- Check backend terminal - should see `[Serial] Received:` messages
- Wait 2-3 seconds for first data

---

## 📚 Next Steps

Once everything is working:

1. **Explore the API**:
   - Visit http://localhost:3000 (status page)
   - Try http://localhost:3000/api/latest (latest data)
   - Try http://localhost:3000/api/history (historical data)

2. **Check the Database**:
   ```sql
   SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 10;
   ```

3. **Add features**:
   - Modify Arduino code for custom logic
   - Add new API endpoints
   - Customize dashboard styling

---

## 🆘 Still Having Issues?

Check these files for detailed help:
- `backend/README.md` - Backend configuration
- `database/README.md` - Database setup
- `frontend/README.md` - Dashboard usage
- `Setups/ProgramStructure.md` - Architecture details

Common issues:
- **Serial port access denied**: Close Arduino IDE Serial Monitor
- **Database permission error**: Use `postgres` superuser or grant permissions
- **WebSocket won't connect**: Check Windows Firewall settings for ports 8080

---

## ✨ Success!

If you see:
- ✅ Arduino sending data every 2 seconds
- ✅ Backend receiving and saving to database
- ✅ Dashboard showing live updates
- ✅ Controls working in MANUAL mode

**Congratulations! Your Smart Home system is fully operational! 🎉**

---

*Need help? Check the terminal/console logs for error messages.*
