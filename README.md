# Smart Home IoT System

Full-stack IoT project with Arduino, MQTT cloud communication, and React dashboard.

## 🎯 Overview

- **Arduino R4 WiFi** → DHT22 sensor, LED, fan, LCD, touch button
- **MQTT Broker** → Cloud communication (broker.hivemq.com)
- **Backend** → Node.js with WebSocket & PostgreSQL
- **Frontend** → React dashboard with live graphs & 3D models

## 🚀 Quick Start

### 1. Arduino Setup

```bash
# Install libraries in Arduino IDE:
# WiFiS3, PubSubClient, LiquidCrystal_I2C, DHT

# Configure credentials
cd arduino/smart_home_main
copy config.example.h config.h
# Edit config.h with your WiFi credentials

# Upload to Arduino R4 WiFi
# Check Serial Monitor for "MQTT Connected"
```

### 2. Database Setup

```bash
createdb smart_home
psql -d smart_home -f database/schema.sql
```

### 3. Backend Setup

```bash
cd backend
npm install
copy .env.example .env
# Edit .env with database password
npm start
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

## 🔌 Architecture

```
Arduino (WiFi) → MQTT Broker → Backend → PostgreSQL
                                  ↓
                             WebSocket
                                  ↓
                            React Dashboard
```

**Communication:**
- **MQTT**: Arduino ↔ Backend (cloud-based)
- **WebSocket**: Real-time data to frontend
- **HTTP REST**: Historical data queries

## ✨ Features

- **AUTO Mode**: LED & fan controlled by humidity thresholds
- **MANUAL Mode**: Direct control from dashboard
- **Live Graphs**: Real-time waveform visualization
- **3D Models**: Animated LED & fan using Three.js
- **Historical Data**: Charts with statistics
- **MQTT Cloud**: Internet-based communication
- **Touch Control**: Physical on/off button
- **LCD Display**: Local sensor readouts

## 🛠️ Tech Stack

**Hardware**: Arduino R4 WiFi, DHT22, LED, Fan, LCD  
**Arduino**: WiFiS3, PubSubClient (MQTT), DHT, LiquidCrystal_I2C  
**Backend**: Node.js, Express, ws, mqtt, PostgreSQL  
**Frontend**: React, TypeScript, Vite, Three.js

## 🔍 Troubleshooting

**WiFi not connecting**: Check credentials in `config.h`, use 2.4GHz network  
**MQTT not connecting**: Verify internet connection, check Serial Monitor  
**DHT22 reads NaN**: Check wiring (VCC, GND, DATA to pin 7)  
**Database error**: Run `pg_isready`, verify credentials in `.env`  
**Frontend not updating**: Check WebSocket connection (green dot), open F12 console

## 📚 Documentation

- [ARCHITECTURE_DIAGRAM.md](Setups/ARCHITECTURE_DIAGRAM.md) - System architecture
- [SECURITY_RISK_ANALYSIS.md](SECURITY_RISK_ANALYSIS.md) - Security analysis
- [PROJECT_LEARNING_OBJECTIVES_ANALYSIS.md](PROJECT_LEARNING_OBJECTIVES_ANALYSIS.md) - Learning objectives (85/100)

## � Author

**H4 IoT and Embedded Systems**  
Danmarks Tekniske Universitet (DTU)  
December 2025

---

**Status**: ✅ Fully Functional | **Learning Objectives**: 20/24 Met
