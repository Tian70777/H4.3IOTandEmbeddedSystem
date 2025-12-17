-- Smart Home Database Schema
-- PostgreSQL database for storing sensor readings

-- Create database (run this manually first)
-- CREATE DATABASE smart_home;

-- Connect to the database
-- \c smart_home;

-- Create sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature DECIMAL(5, 2) NOT NULL,
    humidity DECIMAL(5, 2) NOT NULL,
    led_status INTEGER NOT NULL,
    fan_speed INTEGER NOT NULL,
    control_mode VARCHAR(10) NOT NULL,
    CONSTRAINT check_temperature CHECK (temperature >= -50 AND temperature <= 100),
    CONSTRAINT check_humidity CHECK (humidity >= 0 AND humidity <= 100),
    CONSTRAINT check_led_status CHECK (led_status IN (0, 1)),
    CONSTRAINT check_fan_speed CHECK (fan_speed >= 0 AND fan_speed <= 255),
    CONSTRAINT check_control_mode CHECK (control_mode IN ('AUTO', 'MANUAL', 'UNKNOWN'))
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);

-- Create index on control_mode for filtering
CREATE INDEX IF NOT EXISTS idx_sensor_readings_mode ON sensor_readings(control_mode);

-- Sample query to verify
-- SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 10;

-- Query to get statistics for last 24 hours
-- SELECT 
--     COUNT(*) as total_readings,
--     AVG(temperature) as avg_temp,
--     MIN(temperature) as min_temp,
--     MAX(temperature) as max_temp,
--     AVG(humidity) as avg_humidity,
--     MIN(humidity) as min_humidity,
--     MAX(humidity) as max_humidity
-- FROM sensor_readings
-- WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Query to cleanup old data (keep last 30 days)
-- DELETE FROM sensor_readings WHERE timestamp < NOW() - INTERVAL '30 days';
