# 📁 Smart Home IoT Project Structure

## 🎯 Project Overview

**Project Name:** Smart Home Monitoring & Control System  
**Smart Home监控与控制系统**

### Components (组件):
- **Arduino R4 WiFi** - Sensor hardware & control (传感器硬件和控制)
- **Backend (Node.js)** - Data processing & communication bridge (数据处理和通信桥梁)
- **Frontend (React/HTML)** - User dashboard (用户仪表板)
- **Database (PostgreSQL)** - Historical data storage (历史数据存储)

### Features (功能):
- ✅ Real-time sensor monitoring (Temperature, Humidity) (实时传感器监控)
- ✅ Automatic control (LED, Fan based on humidity) (自动控制)
- ✅ Manual control via dashboard (通过仪表板手动控制)
- ✅ Touch button for system on/off (触摸按钮开关系统)
- ✅ LCD display for local monitoring (LCD显示屏本地监控)
- ✅ Dual mode: Online (WiFi) & Offline (Serial USB) (双模式)

---

## 📂 Recommended Folder Structure (推荐文件夹结构)

```
H4/3. IOTandEmbeddedSystem/
│
├── arduino/                          # Arduino code (Arduino代码)
│   ├── smart_home_main/             # Main Arduino sketch folder
│   │   └── smart_home_main.ino      # Your Arduino code here
│   │
│   ├── tests/                       # Test sketches (测试代码)
│   │   ├── test_dht22.ino          # Test DHT22 sensor
│   │   ├── test_lcd.ino            # Test LCD display
│   │   └── test_fan_led.ino        # Test LED & Fan
│   │
│   └── libraries/                   # Custom libraries (if any)
│
├── backend/                         # Node.js backend (Node.js后端)
│   ├── src/
│   │   ├── index.js                # Main entry point (主入口)
│   │   │
│   │   ├── transports/             # Communication adapters (通信适配器)
│   │   │   ├── BaseTransport.js   # Abstract base class (抽象基类)
│   │   │   ├── SerialTransport.js # Serial USB adapter (串口适配器)
│   │   │   └── HttpTransport.js   # HTTP adapter (future) (HTTP适配器)
│   │   │
│   │   ├── services/               # Business logic (业务逻辑)
│   │   │   ├── DatabaseService.js # PostgreSQL operations (数据库操作)
│   │   │   ├── WebSocketService.js# WebSocket server (WebSocket服务器)
│   │   │   └── ValidationService.js# Data validation (数据验证)
│   │   │
│   │   ├── api/                    # REST API endpoints (REST API端点)
│   │   │   └── routes.js          # API routes (API路由)
│   │   │
│   │   └── utils/                  # Helper functions (辅助函数)
│   │       ├── parser.js          # Data parsing utilities (数据解析)
│   │       └── logger.js          # Logging utilities (日志)
│   │
│   ├── config/
│   │   └── config.js              # Configuration (配置)
│   │
│   ├── package.json               # npm dependencies (npm依赖)
│   ├── .env                       # Environment variables (环境变量)
│   └── README.md                  # Backend documentation (后端文档)
│
├── frontend/                       # React/HTML dashboard (前端仪表板)
│   ├── public/
│   │   └── index.html            # Main HTML file (主HTML文件)
│   │
│   ├── src/
│   │   ├── components/           # React components (React组件)
│   │   │   ├── Dashboard.jsx    # Main dashboard (主仪表板)
│   │   │   ├── LiveDataCard.jsx # Real-time data display (实时数据)
│   │   │   ├── ControlPanel.jsx # Manual controls (手动控制)
│   │   │   ├── HistoryChart.jsx # Historical charts (历史图表)
│   │   │   └── StatusIndicator.jsx# Status indicators (状态指示器)
│   │   │
│   │   ├── services/
│   │   │   ├── websocketClient.js# WebSocket connection (WebSocket连接)
│   │   │   └── apiClient.js     # HTTP API calls (HTTP API调用)
│   │   │
│   │   ├── styles/
│   │   │   └── App.css          # Styling (样式)
│   │   │
│   │   └── App.jsx              # Root component (根组件)
│   │
│   ├── package.json
│   └── README.md
│
├── database/                       # Database files (数据库文件)
│   ├── schema.sql                # Database schema (数据库模式)
│   ├── migrations/               # Database migrations (数据库迁移)
│   │   └── 001_initial_setup.sql
│   └── seeds/                    # Test data (测试数据)
│       └── sample_data.sql
│
├── docs/                          # Documentation (文档)
│   ├── API.md                    # API documentation (API文档)
│   ├── SETUP.md                  # Setup instructions (设置说明)
│   └── ARCHITECTURE.md           # System architecture (系统架构)
│
├── Setups/                        # Your current setup notes (当前设置笔记)
│   ├── ProgramStructure.md       # This file (本文件)
│   ├── DataFlowApproaches.md
│   ├── CommunicationStructure.md
│   └── Flow.md
│
├── Logs/                          # Development logs (开发日志)
│   └── Log.md
│
└── README.md                      # Project overview (项目概述)
```

---

## 🔄 Data Flow Architecture (数据流架构)

```
┌─────────────────────────────────────────────────────────────┐
│                        ARDUINO                              │
│  Hardware Layer (硬件层)                                     │
│                                                             │
│  Components:                                                │
│  ├─ DHT22 Sensor (温湿度传感器)                            │
│  ├─ LED (指示灯)                                            │
│  ├─ Fan with PWM control (PWM控制风扇)                      │
│  ├─ LCD Display (LCD显示屏)                                 │
│  └─ Touch Button (触摸按钮)                                 │
│                                                             │
│  Logic:                                                     │
│  ├─ AUTO mode: humidity-based control (湿度自动控制)       │
│  └─ MANUAL mode: dashboard control (仪表板手动控制)        │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Communication Layer (通信层)
               │
    ┌──────────┼──────────┐
    │          │          │
Serial USB    HTTP      (MQTT future)
   🔵         🔵         🔵
    │          │          │
    └──────────┴──────────┘
               │
               ↓
┌──────────────▼──────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
│  Processing Layer (处理层)                                   │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │  Transport Adapters (传输适配器)               │        │
│  │  • SerialTransport - USB communication         │        │
│  │  • HttpTransport - WiFi communication          │        │
│  └────────────┬───────────────────────────────────┘        │
│               │                                             │
│               ↓                                             │
│  ┌────────────▼───────────────────────────────────┐        │
│  │  Business Logic (业务逻辑)                      │        │
│  │  • Data validation (数据验证)                   │        │
│  │  • Command processing (命令处理)               │        │
│  │  • State management (状态管理)                 │        │
│  └────────────┬───────────────────────────────────┘        │
│               │                                             │
│       ┌───────┴────────┐                                    │
│       │                │                                    │
│       ↓                ↓                                    │
│  ┌────▼─────┐    ┌────▼──────────┐                        │
│  │PostgreSQL│    │   WebSocket   │                        │
│  │ Service  │    │    Service    │                        │
│  │          │    │               │                        │
│  │• Save    │    │• Broadcast to │                        │
│  │  history │    │  all clients  │                        │
│  │• Query   │    │• Push live    │                        │
│  │  data    │    │  updates      │                        │
│  └──────────┘    └────┬──────────┘                        │
│                       │                                    │
│  ┌────────────────────▼──────────────┐                    │
│  │      REST API (REST接口)          │                    │
│  │  • GET /api/latest               │                    │
│  │  • GET /api/history              │                    │
│  │  • POST /api/command             │                    │
│  └───────────────────────────────────┘                    │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ WebSocket (ws://) for live data
               │ HTTP for commands & history
               │
               ↓
┌──────────────▼──────────────────────────────────────────────┐
│                  FRONTEND (Browser)                         │
│  Presentation Layer (展示层)                                 │
│                                                             │
│  Components:                                                │
│  ├─ Live Data Cards (实时数据卡片)                          │
│  │  └─ Temperature, Humidity, LED, Fan                     │
│  │                                                          │
│  ├─ Control Panel (控制面板)                                │
│  │  ├─ Auto/Manual toggle (自动/手动切换)                  │
│  │  ├─ LED ON/OFF button (LED开关按钮)                    │
│  │  └─ Fan speed slider (风扇速度滑块)                     │
│  │                                                          │
│  ├─ Historical Charts (历史图表)                            │
│  │  └─ Temperature & Humidity trends                       │
│  │                                                          │
│  └─ Status Indicators (状态指示器)                          │
│     └─ Connection status, Mode, System ON/OFF              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema (数据库模式)

```sql
-- Main table for sensor readings
CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    led_status BOOLEAN NOT NULL,
    fan_speed SMALLINT NOT NULL CHECK (fan_speed >= 0 AND fan_speed <= 255),
    control_mode VARCHAR(10) NOT NULL CHECK (control_mode IN ('auto', 'manual')),
    system_on BOOLEAN NOT NULL DEFAULT true,
    source VARCHAR(10) CHECK (source IN ('serial', 'http', 'mqtt'))
);

-- Index for fast time-based queries
CREATE INDEX idx_timestamp ON sensor_readings(timestamp DESC);

-- Optional: Command history table
CREATE TABLE command_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    command_type VARCHAR(20) NOT NULL,
    command_value TEXT NOT NULL,
    source VARCHAR(20) NOT NULL
);
```

---

## 🔌 Communication Protocols (通信协议)

### Serial USB Protocol (串口USB协议)

**Arduino → Backend (Data):**
```
Format: DATA:temp=23.4,hum=50.2,led=1,fan=150,mode=auto
```

**Backend → Arduino (Commands):**
```
Format: MODE:MANUAL;LED:1;FAN:200
```

### WebSocket Protocol (WebSocket协议)

**Backend → Frontend (Live Data):**
```json
{
  "temperature": 23.4,
  "humidity": 50.2,
  "led": 1,
  "fan": 150,
  "mode": "auto",
  "timestamp": "2025-12-09T10:30:00Z"
}
```

### REST API (REST接口)

**GET /api/latest** - Get most recent reading
```json
{
  "temperature": 23.4,
  "humidity": 50.2,
  "led": true,
  "fan": 150,
  "mode": "auto"
}
```

**POST /api/command** - Send command to Arduino
```json
{
  "mode": "manual",
  "led": true,
  "fan": 200
}
```

**GET /api/history?from=2025-12-08&to=2025-12-09** - Get historical data

---

## 🚀 Current Implementation Status (当前实施状态)

### ✅ Phase 1: Arduino Hardware (COMPLETED)
- [x] DHT22 sensor reading (温湿度传感器读取)
- [x] LED control based on humidity (基于湿度的LED控制)
- [x] Fan PWM control (风扇PWM控制)
- [x] LCD display (LCD显示)
- [x] Touch button system on/off (触摸按钮开关)
- [x] WiFi connection (home + hotspot) (WiFi连接)
- [x] AUTO/MANUAL mode logic (自动/手动模式逻辑)
- [x] Serial command handling (串口命令处理)

### ⏳ Phase 2: Backend (IN PROGRESS - 进行中)
- [ ] Node.js project setup (Node.js项目设置)
- [ ] Serial transport implementation (串口传输实现)
- [ ] Database connection (数据库连接)
- [ ] WebSocket server (WebSocket服务器)
- [ ] REST API endpoints (REST API端点)

### ⏳ Phase 3: Frontend (NOT STARTED - 未开始)
- [ ] Dashboard UI (仪表板UI)
- [ ] WebSocket client (WebSocket客户端)
- [ ] Control panel (控制面板)
- [ ] Historical charts (历史图表)

### ⏳ Phase 4: Integration & Testing (NOT STARTED - 未开始)
- [ ] End-to-end testing (端到端测试)
- [ ] Error handling (错误处理)
- [ ] Performance optimization (性能优化)
- [ ] Documentation (文档)

---

## 📝 Next Steps (下一步)

### Immediate (立即):
1. Create backend folder structure (创建后端文件夹结构)
2. Initialize Node.js project (初始化Node.js项目)
3. Install required npm packages (安装所需npm包)
4. Implement SerialTransport (实现串口传输)

### This Week (本周):
5. Connect Arduino to backend via Serial (通过串口连接Arduino到后端)
6. Setup PostgreSQL database (设置PostgreSQL数据库)
7. Implement WebSocket broadcasting (实现WebSocket广播)
8. Create basic HTML dashboard (创建基本HTML仪表板)

### Next Week (下周):
9. Add manual control commands (添加手动控制命令)
10. Implement REST API endpoints (实现REST API端点)
11. Add historical data charts (添加历史数据图表)
12. Testing and bug fixes (测试和修复错误)

---

## 🛠️ Development Tools (开发工具)

### Required Software (必需软件):
- **Arduino IDE** (1.8.19 or 2.x) - For Arduino development
- **Node.js** (v18 or later) - For backend
- **PostgreSQL** (v14 or later) - For database
- **VS Code** - Code editor (推荐)
- **Git** - Version control (版本控制)

### Recommended VS Code Extensions (推荐VS Code扩展):
- Arduino (Microsoft)
- ESLint (JavaScript linting)
- Prettier (Code formatting)
- PostgreSQL (Database management)

### npm Packages (npm包):
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "serialport": "^12.0.0",
    "@serialport/parser-readline": "^12.0.0",
    "ws": "^8.14.0",
    "pg": "^8.11.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

## 📚 Key Design Decisions (关键设计决策)

### 1. **Transport Adapter Pattern** (传输适配器模式)
- **Why:** Easy to switch between Serial/HTTP/MQTT (易于切换通信方式)
- **Benefit:** Add new communication methods without changing core logic (添加新通信方式无需改变核心逻辑)

### 2. **WebSocket for Live Data** (WebSocket用于实时数据)
- **Why:** Real-time push from backend to frontend (实时从后端推送到前端)
- **Benefit:** No polling, instant updates (无需轮询，即时更新)

### 3. **Dual Mode: AUTO/MANUAL** (双模式：自动/手动)
- **Why:** Flexibility for different use cases (不同使用场景的灵活性)
- **Benefit:** Can operate autonomously or be controlled (可自主运行或手动控制)

### 4. **Serial USB as Primary** (串口USB作为主要方式)
- **Why:** Guaranteed to work, no network issues (保证工作，无网络问题)
- **Benefit:** Reliable for school demo (学校演示可靠)

---

## 🎯 Project Goals (项目目标)

### Technical Goals (技术目标):
- ✅ Real-time sensor monitoring (实时传感器监控)
- ✅ Bidirectional communication (双向通信)
- ✅ Historical data storage & visualization (历史数据存储和可视化)
- ✅ Responsive web dashboard (响应式网页仪表板)
- ✅ Robust error handling (健壮的错误处理)

### Learning Goals (学习目标):
- 📚 Understand IoT architecture patterns (理解物联网架构模式)
- 📚 Learn full-stack development (学习全栈开发)
- 📚 Practice real-time communication (练习实时通信)
- 📚 Database design & optimization (数据库设计和优化)
- 📚 Hardware-software integration (硬件软件集成)

---

**Last Updated:** December 9, 2025  
**Project Status:** Phase 1 Complete, Starting Phase 2  
**项目状态:** 第一阶段完成，开始第二阶段
