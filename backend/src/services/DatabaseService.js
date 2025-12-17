// Database Service
// Handles PostgreSQL database operations

const { Pool } = require('pg'); // PostgreSQL client
// a pool is a collection of reusable database connections
// faster than opening/closing a new connection each time
class DatabaseService {
  constructor(config) {
    this.config = config;  // Store connection info
    this.pool = null;      // Connection pool (not connected yet)
  }

  /**
   * Connect to PostgreSQL database
   */
  async connect() {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('[Database] Connected successfully');
      
      // Check if table exists, create if not
      await this.initializeTable(client);
      
      client.release(); // Close test connection, Give connection back to pool
    } catch (error) {
      console.error('[Database] Connection error:', error.message);
      throw error;
    }
  }

  /**
   * Initialize sensor_readings table if it doesn't exist
   */
  async initializeTable(client) {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        temperature DECIMAL(5, 2),
        humidity DECIMAL(5, 2),
        led_status INTEGER,
        fan_speed INTEGER,
        control_mode VARCHAR(10)
      );
    `;

    try {
      await client.query(createTableQuery);
      console.log('[Database] Table "sensor_readings" is ready');
    } catch (error) {
      console.error('[Database] Error creating table:', error.message);
      throw error;
    }
  }

  /**
   * Save sensor data to database
   * @param {Object} data - Sensor data object
   */
  async saveReading(data) {
    // SQL query with placeholders ($1, $2, $3...)
    // SQL injection protection! Values are escaped automatically
    const query = `
      INSERT INTO sensor_readings (temperature, humidity, led_status, fan_speed, control_mode)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, timestamp;
    `;
    // The actual values
    const values = [
      data.temperature,
      data.humidity,
      data.led_status,
      data.fan_speed,
      data.control_mode
    ];

    try {
      const result = await this.pool.query(query, values);
      console.log(`[Database] Saved reading #${result.rows[0].id}`);
      return result.rows[0];// Returns { id: 1, timestamp: '2025-12-10...' }
    } catch (error) {
      console.error('[Database] Error saving reading:', error.message);
      throw error;
    }
  }

  /**
   * Get the most recent sensor reading
   */
  async getLatestReading() {
    const query = `
      SELECT * FROM sensor_readings
      ORDER BY timestamp DESC
      LIMIT 1;
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[Database] Error fetching latest reading:', error.message);
      throw error;
    }
  }

  /**
   * Get historical sensor readings
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   */
  async getHistory(limit = 100, offset = 0) {
    const query = `
      SELECT * FROM sensor_readings
      ORDER BY timestamp DESC
      LIMIT $1 OFFSET $2;
    `;

    try {
      const result = await this.pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('[Database] Error fetching history:', error.message);
      throw error;
    }
  }

  /**
   * Get readings within a time range
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   */
  async getReadingsByTimeRange(startTime, endTime) {
    const query = `
      SELECT * FROM sensor_readings
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp ASC;
    `;

    try {
      const result = await this.pool.query(query, [startTime, endTime]);
      return result.rows;
    } catch (error) {
      console.error('[Database] Error fetching readings by time range:', error.message);
      throw error;
    }
  }

  /**
   * Get statistics (average, min, max) for a time period
   * @param {Date} startTime - Start of time period
   * @param {Date} endTime - End of time period
   */
  async getStatistics(startTime, endTime) {
    const query = `
      SELECT 
        COUNT(*) as total_readings,
        AVG(temperature) as avg_temp,
        MIN(temperature) as min_temp,
        MAX(temperature) as max_temp,
        AVG(humidity) as avg_humidity,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity,
        AVG(fan_speed) as avg_fan_speed
      FROM sensor_readings
      WHERE timestamp BETWEEN $1 AND $2;
    `;

    try {
      const result = await this.pool.query(query, [startTime, endTime]);
      return result.rows[0];
    } catch (error) {
      console.error('[Database] Error fetching statistics:', error.message);
      throw error;
    }
  }

  /**
   * Delete old readings (for cleanup)
   * @param {number} daysToKeep - Number of days of data to keep
   */
  async cleanupOldReadings(daysToKeep = 30) {
    const query = `
      DELETE FROM sensor_readings
      WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING id;
    `;

    try {
      const result = await this.pool.query(query);
      console.log(`[Database] Deleted ${result.rowCount} old readings`);
      return result.rowCount;
    } catch (error) {
      console.error('[Database] Error cleaning up old readings:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed analytics for historical analysis page
   * @param {Date} startTime - Start of time period
   * @param {Date} endTime - End of time period
   */
  async getDetailedAnalytics(startTime, endTime) {
    const query = `
      SELECT 
        COUNT(*) as total_readings,
        AVG(temperature) as avg_temp,
        MIN(temperature) as min_temp,
        MAX(temperature) as max_temp,
        AVG(humidity) as avg_humidity,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity,
        AVG(fan_speed) as avg_fan_speed,
        SUM(CASE WHEN led_status = 1 THEN 1 ELSE 0 END) as led_on_count,
        (SUM(CASE WHEN led_status = 1 THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100) as led_on_percentage
      FROM sensor_readings
      WHERE timestamp BETWEEN $1 AND $2;
    `;

    try {
      const result = await this.pool.query(query, [startTime, endTime]);
      const stats = result.rows[0];

      // Calculate fan runtime hours (assuming readings every 2 seconds)
      const totalHours = (endTime - startTime) / (1000 * 60 * 60);
      const avgFanSpeedPercent = (stats.avg_fan_speed || 0) / 255;
      const fanRuntimeHours = totalHours * avgFanSpeedPercent;

      // Estimate energy consumption (12W fan at average speed)
      const estimatedKwh = (fanRuntimeHours * 12) / 1000;

      return {
        ...stats,
        fan_runtime_hours: fanRuntimeHours,
        estimated_kwh: estimatedKwh
      };
    } catch (error) {
      console.error('[Database] Error fetching detailed analytics:', error.message);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      console.log('[Database] Disconnected');
    }
  }
}

module.exports = DatabaseService;
