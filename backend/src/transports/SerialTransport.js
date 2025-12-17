// Serial Transport Implementation
// Handles USB Serial communication with Arduino

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const BaseTransport = require('./BaseTransport');

class SerialTransport extends BaseTransport {
  constructor(portPath, baudRate = 9600) {
    super('Serial');
    this.portPath = portPath;
    this.baudRate = baudRate;
    this.port = null;
    this.parser = null;
  }

  /**
   * Connect to Arduino via Serial port
   */
  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`[Serial] Connecting to ${this.portPath} at ${this.baudRate} baud...`);

      this.port = new SerialPort({
        path: this.portPath,
        baudRate: this.baudRate,
        autoOpen: false
      });

      this.port.open((err) => {
        if (err) {
          console.error('[Serial] Failed to open port:', err.message);
          return reject(err);
        }

        console.log('[Serial] Port opened successfully');

        // Create parser to read line-by-line
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        // Listen for incoming data
        this.parser.on('data', (line) => {
          line = line.trim();
          
          // Debug: Log all received lines
          console.log('[Serial] Received:', line);

          // Only process lines that start with "DATA:"
          if (line.startsWith('DATA:')) {
            const parsedData = this.parseData(line);
            
            if (parsedData && this.onDataCallback) {
              this.onDataCallback(parsedData);
            }
          }
        });

        // Handle port errors
        this.port.on('error', (err) => {
          console.error('[Serial] Port error:', err.message);
        });

        // Handle port close
        this.port.on('close', () => {
          console.log('[Serial] Port closed');
        });

        resolve();
      });
    });
  }

  /**
   * Send command to Arduino
   * Format: "MODE:MANUAL;LED:1;FAN:200\n"
   */
  async sendCommand(command) {
    if (!this.port || !this.port.isOpen) {
      throw new Error('Serial port is not open');
    }

    return new Promise((resolve, reject) => {
      // Ensure command ends with newline
      const commandWithNewline = command.endsWith('\n') ? command : command + '\n';
      
      console.log('[Serial] Sending command:', command);

      this.port.write(commandWithNewline, (err) => {
        if (err) {
          console.error('[Serial] Error sending command:', err.message);
          return reject(err);
        }
        
        console.log('[Serial] Command sent successfully');
        resolve();
      });
    });
  }

  /**
   * Close Serial port
   */
  async disconnect() {
    if (this.port && this.port.isOpen) {
      return new Promise((resolve) => {
        this.port.close(() => {
          console.log('[Serial] Disconnected');
          resolve();
        });
      });
    }
  }

  /**
   * List all available Serial ports
   * Useful for finding Arduino's COM port
   */
  static async listPorts() {
    const ports = await SerialPort.list();
    console.log('\n=== Available Serial Ports ===');
    ports.forEach((port, index) => {
      console.log(`${index + 1}. ${port.path}`);
      if (port.manufacturer) console.log(`   Manufacturer: ${port.manufacturer}`);
      if (port.serialNumber) console.log(`   Serial Number: ${port.serialNumber}`);
      if (port.vendorId) console.log(`   Vendor ID: ${port.vendorId}`);
      if (port.productId) console.log(`   Product ID: ${port.productId}`);
      console.log('');
    });
    return ports;
  }
}

module.exports = SerialTransport;
