// Base Transport Interface
// All transport implementations (Serial, HTTP, MQTT) will extend this class

class BaseTransport {
  constructor(name) {
    this.name = name;
    this.onDataCallback = null;
  }

  /**
   * Initialize the transport connection
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Send command to Arduino
   * @param {string} command - Command string to send
   * @returns {Promise<void>}
   */
  async sendCommand(command) {
    throw new Error('sendCommand() must be implemented by subclass');
  }

  /**
   * Close the transport connection
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  /**
   * Register callback for incoming data
   * @param {Function} callback - Function to call when data is received
   */
  onData(callback) {
    this.onDataCallback = callback;
  }

  /**
   * Parse Arduino data string into object
   * Format: "DATA:temp=23.4,hum=50,led=1,fan=150,mode=AUTO"
   * @param {string} dataString - Raw data string from Arduino
   * @returns {Object|null} Parsed data object or null if invalid
   */
  parseData(dataString) {
    try {
      // Check if string starts with "DATA:"
      if (!dataString.startsWith('DATA:')) {
        console.log('Invalid data format (missing DATA: prefix):', dataString);
        return null;
      }

      // Remove "DATA:" prefix
      const dataContent = dataString.substring(5).trim();
      
      // Split by comma
      const pairs = dataContent.split(',');
      const data = {};

      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value !== undefined) {
          // Convert numeric values
          if (key === 'temp' || key === 'hum') {
            data[key] = parseFloat(value);
          } else if (key === 'led' || key === 'fan') {
            data[key] = parseInt(value);
          } else {
            data[key] = value; // Keep mode as string
          }
        }
      });

      // Validate required fields
      if (data.temp !== undefined && data.hum !== undefined && 
          data.led !== undefined && data.fan !== undefined) {
        return {
          temperature: data.temp,
          humidity: data.hum,
          led_status: data.led,
          fan_speed: data.fan,
          control_mode: data.mode || 'UNKNOWN',
          timestamp: new Date()
        };
      }

      console.log('Missing required fields in data:', data);
      return null;

    } catch (error) {
      console.error('Error parsing data:', error.message);
      return null;
    }
  }
}

module.exports = BaseTransport;
