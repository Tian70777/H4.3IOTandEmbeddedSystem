// Smart Home Backend - Main Entry Point
// Coordinates Serial communication, WebSocket broadcasting, database storage, and REST API

require('dotenv').config(); // ← This reads the .env file, DB credentials etc.
const express = require('express'); // ← Web framework for HTTP API
const cors = require('cors'); // ← Allows frontend to talk to backend

const SerialTransport = require('./transports/SerialTransport');
const HttpTransport = require('./transports/HttpTransport');
const MqttTransport = require('./transports/MqttTransport');
const WebSocketService = require('./services/WebSocketService');
const DatabaseService = require('./services/DatabaseService');
const initializeRoutes = require('./api/routes');

// ========== CONFIGURATION ==========
// Creates a big object with all settings
const CONFIG = {
  transport: {
    // Default to MQTT if not set
    type: process.env.TRANSPORT_TYPE || 'mqtt' // 'serial', 'http', or 'mqtt'
  },
  serial: {
    port: process.env.SERIAL_PORT || 'COM3',
    baudRate: parseInt(process.env.SERIAL_BAUD_RATE) || 9600 // Communication speed
  },
  http: {
    arduinoUrl: process.env.ARDUINO_HTTP_URL || 'http://192.168.1.150',
    pollInterval: parseInt(process.env.HTTP_POLL_INTERVAL) || 2000
  },
  mqtt: {
    broker: process.env.MQTT_BROKER || 'broker.hivemq.com', // MQTT server address
    port: parseInt(process.env.MQTT_PORT) || 1883,          // MQTT server port
    useSSL: process.env.MQTT_USE_SSL === 'true',
    topics: {
      // Where Arduino publishes data
      sensorData: process.env.MQTT_TOPIC_SENSOR_DATA || 'home/arduino/sensors',
      // Where we send commands
      ontrol: process.env.MQTT_TOPIC_CONTROL || 'home/arduino/control',
    }
  },
  database: {
    host: process.env.DB_HOST || 'localhost', // ← Gets "localhost" from .env
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'smart_home',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  },
  server: {
    httpPort: parseInt(process.env.HTTP_PORT) || 3000, // REST API port
    wsPort: parseInt(process.env.WS_PORT) || 8080 // WebSocket port
  }
};

// ========== SERVICE INSTANCES ==========
let transport = null; // Will hold MqttTransport/SerialTransport/HttpTransport
let wsService = null; // Will hold WebSocketService
let dbService = null; // Will hold DatabaseService
let app = null;       // Will hold Express app
let httpServer = null;// Will hold HTTP server instance

// ========== INITIALIZATION ==========
async function initialize() {
  console.log('\n========================================');
  console.log('   Smart Home Backend Starting...');
  console.log('========================================\n');

  try {
    // 1. Initialize Database, Create a new DatabaseService object
    // passing config (host, port, password, etc.)
    // Call connect() which returns a Promise
    // await means "wait here until connect() finishes before continuing"
    console.log('[Init] Connecting to database...');
    dbService = new DatabaseService(CONFIG.database);
    await dbService.connect();

    // 2. Initialize WebSocket Service
    // This handles client connections and broadcasting data
    // Creates WebSocket server listening on port 8080
    // Browser can connect: new WebSocket('ws://localhost:8080')
    console.log('[Init] Starting WebSocket server...');
    wsService = new WebSocketService(CONFIG.server.wsPort); // Pass 8080
    wsService.start();

    // 3. Initialize Transport based on configuration
    let transportInitialized = false;
    
    // Initialize based on configured transport type
    if (CONFIG.transport.type === 'mqtt') {
      console.log('[Init] Connecting to Arduino via MQTT...');
      transport = new MqttTransport(CONFIG.mqtt);
      
      try {
        await transport.connect(); // Connect to broker.hivemq.com
        transportInitialized = true;
        console.log('[Init] ✓ MQTT connection successful!');
      } catch (error) {
        console.error('[MQTT] Failed to connect:', error.message);
        console.log('[Init] ⚠️  MQTT will continue trying to reconnect in background');
        // Don't set transport to null - MQTT will reconnect automatically
        transportInitialized = true; // Still mark as initialized since MQTT auto-reconnects
      }
    }
    else if (CONFIG.transport.type === 'serial') {
      console.log('[Init] Connecting to Arduino via Serial...');
      transport = new SerialTransport(CONFIG.serial.port, CONFIG.serial.baudRate);
      
      try {
        await transport.connect();
        transportInitialized = true;
        console.log('[Init] ✓ Serial connection successful!');
      } catch (error) {
        console.error('[Serial] Failed to connect:', error.message);
        throw error; // Fail if serial is explicitly configured but doesn't work
      }
    }
    else if (CONFIG.transport.type === 'http') {
      console.log('[Init] Connecting to Arduino via HTTP...');
      transport = new HttpTransport(CONFIG.http.arduinoUrl, CONFIG.http.pollInterval);
      try {
        await transport.connect();
        transportInitialized = true;
        console.log('[Init] ✓ HTTP connection successful!');
      } catch (error) {
        console.error('[HTTP] Failed to connect:', error.message);
        throw error; // Fail if HTTP is explicitly configured but doesn't work
      }
    }
    
    if (!transportInitialized) {
      throw new Error('No transport configured. Set TRANSPORT_TYPE in .env to mqtt, serial, or http');
    }
    
    // Register data handler (Arduino → Backend) (MOST IMPORTANT!)
    /*transport.onData(...) - "When Arduino sends data, do this..."
    data - Object like { temperature: 22.2, humidity: 44.6, led_status: 0, fan_speed: 0 }
    await dbService.saveReading(data) - Save to PostgreSQL (takes ~10ms)
    wsService.broadcast(data) - Push to all connected browsers instantly
    */
    transport.onData(async (data) => {
      console.log('[Data] Received from Arduino:', data);

      try {
        // Save to database
        await dbService.saveReading(data);
        
        // Broadcast to WebSocket clients
        wsService.broadcast(data);

      } catch (error) {
        console.error('[Data] Error processing data:', error.message);
      }
    });

    // Register command handler (Frontend → Arduino via WebSocket)
    /*
    Browser sends: { type: 'command', command: 'LED:1' } via WebSocket
    WebSocketService calls this callback function
    We forward it to Arduino via transport (MQTT/Serial/HTTP)
    Flow: Browser → WebSocket → Backend → MQTT → Arduino
    */
    // (data) => { ... } is a callback function, saved in wsService.onCommandReceived
    // mqttTransport.onCommandReceived = (command) => { ... }
    wsService.onCommand((command) => {
      console.log('[Command] Received from frontend:', command);
      
      // Send command to Arduino
      if (transport && transport.sendCommand) {
        transport.sendCommand(command);
        console.log('[Command] Sent to Arduino:', command);
      } else {
        console.error('[Command] Transport does not support sending commands');
      }
    });

    // 4. Initialize Express HTTP Server
    console.log('[Init] Starting HTTP REST API server...');
    app = express();
    
    // Middleware
    app.use(cors()); // Allow requests from localhost:5173
    app.use(express.json()); // Parse JSON in request body
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req, res, next) => {
      console.log(`[HTTP] ${req.method} ${req.path}`);
      next(); // Continue to next handler
    });

    // Health check endpoint
    app.get('/', (req, res) => {
      res.json({
        service: 'Smart Home Backend',
        status: 'running',
        version: '1.0.0',
        endpoints: {
          rest: `http://localhost:${CONFIG.server.httpPort}/api`,
          websocket: `ws://localhost:${CONFIG.server.wsPort}`
        },
        connections: {
          arduino: transport.port?.isOpen ? 'connected' : 'disconnected',
          database: dbService.pool ? 'connected' : 'disconnected',
          websocket_clients: wsService.getClientCount()
        }
      });
    });

    // API routes
    /*
    Call initializeRoutes() function (from routes.js)
    Pass it dbService and transport so routes can use them
    Mount all routes under /api prefix
    */
    const apiRoutes = initializeRoutes(dbService, transport);
    app.use('/api', apiRoutes);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error('[HTTP] Error:', err.message);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message
      });
    });

    // Start HTTP server:Starts listening on port 3000
    // Now browsers can make HTTP requests to http://localhost:3000
    httpServer = app.listen(CONFIG.server.httpPort, () => {
      console.log(`[HTTP] REST API server listening on port ${CONFIG.server.httpPort}`);
    });

    console.log('\n========================================');
    console.log('   Backend Ready!');
    console.log('========================================');
    console.log(`REST API:   http://localhost:${CONFIG.server.httpPort}`);
    console.log(`WebSocket:  ws://localhost:${CONFIG.server.wsPort}`);
    console.log(`Serial:     ${CONFIG.serial.port} @ ${CONFIG.serial.baudRate} baud`);
    console.log(`Database:   ${CONFIG.database.database} @ ${CONFIG.database.host}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n[FATAL] Initialization failed:', error.message);
    console.error(error.stack);
    await shutdown();
    process.exit(1);
  }
}

// ========== GRACEFUL SHUTDOWN ==========
async function shutdown() {
  console.log('\n[Shutdown] Closing connections...');

  try {
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
      console.log('[Shutdown] HTTP server closed');
    }

    if (wsService) {
      wsService.stop();
    }

    if (transport) {
      await transport.disconnect();
    }

    if (dbService) {
      await dbService.disconnect();
    }

    console.log('[Shutdown] All connections closed');
    console.log('Goodbye!\n');
  } catch (error) {
    console.error('[Shutdown] Error during shutdown:', error.message);
  }
}

// ========== SIGNAL HANDLERS ==========
process.on('SIGINT', async () => {
  console.log('\n[Signal] Received SIGINT (Ctrl+C)');
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Signal] Received SIGTERM');
  await shutdown();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('[Error] Uncaught Exception:', error.message);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Error] Unhandled Promise Rejection:', reason);
});

// ========== START APPLICATION ==========
initialize();
