// WebSocket Service
// Manages WebSocket connections and broadcasts data to frontend clients

const WebSocket = require('ws');

class WebSocketService {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;            // WebSocket server instance
    this.clients = new Set();   // Set of connected clients
  }

  /**
   * Start WebSocket server
   */
  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    console.log(`[WebSocket] Server started on port ${this.port}`);

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`[WebSocket] New client connected from ${clientIp}`);
      
      this.clients.add(ws);
      console.log(`[WebSocket] Total connected clients: ${this.clients.size}`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to Smart Home Backend',
        timestamp: new Date()
      }));

      // Handle client messages (MANUAL MODE COMMANDS)
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log(`[WebSocket] Received from client:`, data);
          
          // Forward command to Arduino if it's a control command
          if (data.type === 'command' && data.command) {
            console.log(`[WebSocket] Forwarding command to Arduino: ${data.command}`);
            
            // 🔥 THIS LINE CALLS THE CALLBACK!
            if (this.onCommandReceived) {
              this.onCommandReceived(data.command); // ← Calls the function stored in this.onCommandReceived
            }
          }
        } catch (error) {
          console.error(`[WebSocket] Error parsing message:`, error.message);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected from ${clientIp}`);
        console.log(`[WebSocket] Total connected clients: ${this.clients.size}`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[WebSocket] Client error:`, error.message);
        this.clients.delete(ws);
      });
    });

    this.wss.on('error', (error) => {
      console.error('[WebSocket] Server error:', error.message);
    });
  }

  /**
   * Broadcast data to all connected clients
   * @param {Object} data - Data object to broadcast
   */
  broadcast(data) {
    if (this.clients.size === 0) {
      // No clients connected, skip broadcasting
      return;
    }

    const message = JSON.stringify({
      type: 'sensor_data',
      data: data,
      timestamp: new Date()
    });

    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          successCount++;
        } catch (error) {
          console.error('[WebSocket] Error sending to client:', error.message);
          failCount++;
        }
      } else {
        // Remove dead connections
        this.clients.delete(client);
        failCount++;
      }
    });

    console.log(`[WebSocket] Broadcasted to ${successCount} clients (${failCount} failed)`);
  }

  /**
   * Stop WebSocket server
   */
  stop() {
    if (this.wss) {
      console.log('[WebSocket] Closing all client connections...');
      
      this.clients.forEach((client) => {
        client.close();
      });
      
      this.wss.close(() => {
        console.log('[WebSocket] Server stopped');
      });
    }
  }

  /**
   * Get number of connected clients
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Register callback for when command is received from frontend
   * This is a SETTER method
   * @param {Function} callback - Function to call with command string
   */
  onCommand(callback) {
    this.onCommandReceived = callback;
  }
}

module.exports = WebSocketService;
