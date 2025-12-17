// HTTP Transport Implementation
// Polls Arduino via HTTP GET requests

const BaseTransport = require('./BaseTransport');

class HttpTransport extends BaseTransport {
  constructor(arduinoUrl, pollInterval = 2000) {
    super('HTTP');
    this.arduinoUrl = arduinoUrl;
    this.pollInterval = pollInterval;
    this.pollTimer = null;
    this.isConnected = false;
  }

  /**
   * Connect to Arduino HTTP server
   * Starts polling for data
   */
  async connect() {
    console.log(`[HTTP] Connecting to Arduino at ${this.arduinoUrl}...`);

    try {
      // Test connection with a ping
      const response = await fetch(`${this.arduinoUrl}/ping`, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        console.log('[HTTP] Connected successfully');
        this.isConnected = true;
        this.startPolling();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[HTTP] Connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Start polling Arduino for data
   */
  startPolling() {
    console.log(`[HTTP] Polling every ${this.pollInterval}ms`);

    this.pollTimer = setInterval(async () => {
      try {
        const response = await fetch(`${this.arduinoUrl}/data`, {
          method: 'GET',
          timeout: 5000
        });

        if (response.ok) {
          const dataString = await response.text();
          
          // Parse data (expects: "DATA:temp=23.4,hum=50,led=1,fan=150,mode=AUTO")
          const parsedData = this.parseData(dataString);
          
          if (parsedData && this.onDataCallback) {
            this.onDataCallback(parsedData);
          }
        } else {
          console.error(`[HTTP] Poll failed: ${response.status}`);
        }
      } catch (error) {
        console.error('[HTTP] Poll error:', error.message);
      }
    }, this.pollInterval);
  }

  /**
   * Send command to Arduino via HTTP POST
   * @param {string} command - Command string to send
   */
  async sendCommand(command) {
    if (!this.isConnected) {
      throw new Error('HTTP transport not connected');
    }

    console.log(`[HTTP] Sending command: ${command}`);

    try {
      const response = await fetch(`${this.arduinoUrl}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: command,
        timeout: 5000
      });

      if (response.ok) {
        console.log('[HTTP] Command sent successfully');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[HTTP] Error sending command:', error.message);
      throw error;
    }
  }

  /**
   * Stop polling and disconnect
   */
  async disconnect() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      console.log('[HTTP] Polling stopped');
    }
    this.isConnected = false;
    console.log('[HTTP] Disconnected');
  }
}

module.exports = HttpTransport;
