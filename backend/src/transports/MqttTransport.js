const mqtt = require('mqtt');
const BaseTransport = require('./BaseTransport');

/**
 * MQTT Transport - Cloud-based communication via MQTT broker
 * Works from anywhere with internet, no local network required
 */
class MqttTransport extends BaseTransport {
    constructor(config) {
        super(); // Call parent constructor
        this.broker = config.broker || 'broker.hivemq.com';
        this.port = config.port || 1883;
        this.useSSL = config.useSSL || false;
        this.topics = {
            sensorData: config.topics?.sensorData || 'home/arduino/sensors',   // Arduino publishes here
            control: config.topics?.control || 'home/arduino/control',         // Backend sends control commands here   
        };
        
        this.client = null;          // MQTT client instance
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
    }

    /**
     * Connect to MQTT broker
     */
    async connect() {
        return new Promise((resolve, reject) => {
            // Build broker URL
            const protocol = this.useSSL ? 'mqtts' : 'mqtt';
            const brokerUrl = `${protocol}://${this.broker}:${this.port}`;
            // Result: 'mqtt://broker.hivemq.com:1883'
            console.log(`[MQTT] Connecting to ${brokerUrl}...`);
            
            // Connect to broker
            this.client = mqtt.connect(brokerUrl, {
                clientId: `smart_home_backend_${Math.random().toString(16).slice(2, 8)}`,
                clean: true,            // Start fresh (don't keep old messages)
                connectTimeout: 4000,   // Timeout for initial connection
                reconnectPeriod: 1000,  // Interval between reconnection attempts
            });

            // Handle connection success
            this.client.on('connect', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                console.log('[MQTT] Connected to broker successfully');
                
                // Subscribe to sensor data topic
                this.client.subscribe(this.topics.sensorData, (err) => {
                    if (err) {
                        console.error('[MQTT] Failed to subscribe to sensor topic:', err);
                        reject(err);
                    } else {
                        console.log(`[MQTT] Subscribed to topic: ${this.topics.sensorData}`);
                        resolve();
                    }
                });
            });

            // Handle incoming messages
            this.client.on('message', (topic, message) => {
                try {
                    if (topic === this.topics.sensorData) {
                        const data = JSON.parse(message.toString());
                        console.log('[MQTT] Received sensor data:', data);
                        // Arduino sent: {"temperature":"22.2","humidity":"44.6","led":"0","fan":"0","mode":"AUTO"}
                        // Transform to standard format
                        const transformedData = {
                            temperature: parseFloat(data.temperature), // Convert "22.2" → 22.2
                            humidity: parseFloat(data.humidity),       // Convert "44.6" → 44.6
                            led_status: parseInt(data.led),             // Convert "0" → 0
                            fan_speed: parseInt(data.fan),               // Convert "0" → 0
                            control_mode: data.mode || 'UNKNOWN',
                            timestamp: new Date(),
                        };

                        // Call the registered callback (same as SerialTransport/HttpTransport)
                        if (this.onDataCallback) {
                            this.onDataCallback(transformedData);
                        }
                    }
                } catch (error) {
                    console.error('[MQTT] Error parsing message:', error);
                }
            });

            // Handle errors
            this.client.on('error', (error) => {
                console.error('[MQTT] Connection error:', error.message);
                if (!this.isConnected) {
                    reject(error);
                }
            });

            // Handle reconnection
            this.client.on('reconnect', () => {
                this.reconnectAttempts++;
                console.log(`[MQTT] Reconnecting... (attempt ${this.reconnectAttempts})`);
                
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.error('[MQTT] Max reconnection attempts reached');
                    this.client.end();
                }
            });

            // Handle disconnection
            this.client.on('close', () => {
                this.isConnected = false;
                console.log('[MQTT] Disconnected from broker');
            });

            // Handle offline
            this.client.on('offline', () => {
                console.log('[MQTT] Client is offline');
            });
        });
    }

    /**
     * Send command to Arduino via MQTT
     * @param {string} command - Command string (e.g., "LED:1", "FAN:150", "MODE:MANUAL")
     */
    async sendCommand(command) {
        if (!this.isConnected || !this.client) {
            throw new Error('MQTT client not connected');
        }

        return new Promise((resolve, reject) => {
            console.log(`[MQTT] Publishing command to ${this.topics.control}: ${command}`);
            /*QoS 0 - "Fire and forget" (may lose message)
            QoS 1 - "At least once" (guaranteed delivery, may duplicate)
            QoS 2 - "Exactly once" (slowest, guaranteed no duplicates)
            Use QoS 1 for commands - important they arrive, but okay if duplicated */
            this.client.publish(this.topics.control, command, { qos: 1 }, (err) => {
                if (err) {
                    console.error('[MQTT] Failed to publish command:', err);
                    reject(err);
                } else {
                    console.log('[MQTT] Command published successfully');
                    resolve();
                }
            });
        });
    }

    /**
     * Disconnect from MQTT broker
     */
    async disconnect() {
        if (this.client) {
            console.log('[MQTT] Disconnecting...');
            await this.client.endAsync();
            this.isConnected = false;
            console.log('[MQTT] Disconnected');
        }
    }

    /**
     * Check if transport is connected
     */
    isReady() {
        return this.isConnected && this.client?.connected;
    }
}

module.exports = MqttTransport;
