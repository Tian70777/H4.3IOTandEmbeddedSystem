const mqtt = require('mqtt');
const BaseTransport = require('./BaseTransport');

/**
 * MQTT Transport - Cloud-based communication via MQTT broker
 * Works from anywhere with internet, no local network required
 */
class MqttTransport extends BaseTransport {
    constructor(config) {
        super();
        this.broker = config.broker || 'broker.hivemq.com';
        this.port = config.port || 1883;
        this.useSSL = config.useSSL || false;
        this.topics = {
            sensorData: config.topics?.sensorData || 'home/arduino/sensors',
            control: config.topics?.control || 'home/arduino/control',
        };
        
        this.client = null;
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

            console.log(`[MQTT] Connecting to ${brokerUrl}...`);
            
            // Connect to broker
            this.client = mqtt.connect(brokerUrl, {
                clientId: `smart_home_backend_${Math.random().toString(16).slice(2, 8)}`,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
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
                        
                        // Transform to standard format
                        const transformedData = {
                            temperature: parseFloat(data.temperature),
                            humidity: parseFloat(data.humidity),
                            led_status: parseInt(data.led),
                            fan_speed: parseInt(data.fan),
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
