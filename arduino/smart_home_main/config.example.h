// config.example.h
// COPY this file to config.h and fill in your real credentials
// config.h will be git-ignored for security

#ifndef CONFIG_H
#define CONFIG_H

// ========== WiFi Configuration ==========
const char* WIFI_HOME_SSID = "YOUR_HOME_WIFI";
const char* WIFI_HOME_PASS = "YOUR_HOME_PASSWORD";
const char* WIFI_PHONE_SSID = "YOUR_PHONE_HOTSPOT";
const char* WIFI_PHONE_PASS = "YOUR_HOTSPOT_PASSWORD";

// ========== MQTT Configuration ==========
const char* MQTT_SERVER = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC_SENSOR = "home/arduino/sensors";
const char* MQTT_TOPIC_CONTROL = "home/arduino/control";

// ========== HTTP Server ==========
const int HTTP_PORT = 80;

// ========== Pin Definitions ==========
#define DHTPIN 7
#define DHTTYPE DHT22
#define LED_PIN 8
#define TOUCH_PIN 2
#define FAN_PIN 9

// ========== Timing Configuration ==========
const unsigned long SENSOR_READ_INTERVAL = 2000;  // 2 seconds
const unsigned long TOUCH_DEBOUNCE_DELAY = 300;   // 300 ms

// ========== LCD Configuration ==========
const uint8_t LCD_ADDRESS = 0x27;
const uint8_t LCD_COLS = 16;
const uint8_t LCD_ROWS = 2;

#endif
