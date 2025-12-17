// Smart Home Monitoring System - Arduino R4 WiFi
// Sensors: DHT22 (Temperature & Humidity)
// Actuators: LED, Fan (PWM control), LCD I2C Display
// Controls: Touch Button (System On/Off)

// ========== LIBRARIES ==========
#include <WiFiS3.h>   // UNO R4 WiFi lib
#include <PubSubClient.h>  // MQTT library
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"

// ========== CONFIGURATION & HELPERS ==========
#include "config.h"         // WiFi credentials, pins, settings
#include "wifi_helper.h"    // WiFi connection helpers
#include "mqtt_helper.h"    // MQTT helpers

// ========== HTTP SERVER SETUP ==========
WiFiServer httpServer(HTTP_PORT);  // HTTP server from config

// ========== GLOBAL OBJECTS ==========
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient); //  Handles MQTT communication using WiFi
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// ========== SYSTEM STATE ==========
enum SystemMode { MODE_OFFLINE, MODE_ONLINE };
SystemMode currentMode = MODE_OFFLINE;

enum ControlMode { MODE_AUTO, MODE_MANUAL };
ControlMode controlMode = MODE_AUTO;

// Manual control states
bool manualLedOn = false;   // Start OFF
int manualFanSpeed = 0;     // 0-255, start OFF
int lastFanSpeed = 0;

// System state
bool systemOn = true;       // Start ON
unsigned long lastReadTime = 0;
unsigned long lastTouchTime = 0;

void setup() {
  Serial.begin(9600);

  pinMode(TOUCH_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);   // enable pin 8 as output
  pinMode(FAN_PIN, OUTPUT);  // D9 controls fan via ULN2003 IN3

  // make sure fan is off at start
  analogWrite(FAN_PIN, 0);

  dht.begin();          // start DHT sensor

  lcd.init();           // start LCD
  lcd.backlight();      // turn on backlight

  lcd.setCursor(0, 0);
  lcd.print("System starting...");
  delay(1000);
  lcd.clear();

  // ===== Try WiFi networks: Home first, then Hotspot =====
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi...");
  
  bool connected = connectToAvailableWiFi(
    WIFI_HOME_SSID, WIFI_HOME_PASS,
    WIFI_PHONE_SSID, WIFI_PHONE_PASS
  );
  
  if (connected) {
    currentMode = MODE_ONLINE;
  } else {
    Serial.println("No WiFi. OFFLINE mode.");
    currentMode = MODE_OFFLINE;
  }
  
  // ---- 3) Show final Wi-Fi result for 2 seconds ----
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi status:");

  lcd.setCursor(0, 1);
  if (currentMode == MODE_ONLINE) {
    lcd.print("ONLINE");
    // Start HTTP server when WiFi connected
    httpServer.begin();
    Serial.println("HTTP server started on port 80");
    Serial.print("Access at: http://");
    Serial.println(WiFi.localIP());
    
    delay(2000);   // keep message for 2s
    
    // ---- 3.5) Show IP address on LCD for 3 seconds ----
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("IP Address:");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());  // Display IP on LCD!
    delay(3000);   // Show IP for 3 seconds
  } else {
    lcd.print("OFFLINE");
    delay(2000);   // keep message for 2s
  }

  lcd.clear();   // then normal display will start in loop()
  
  // ========== MQTT SETUP ==========
  if (currentMode == MODE_ONLINE) {
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT); // Tell MQTT client which broker to connect to
    // Register a function to handle incoming messages
    // Like: "When someone sends me a message, call this function"
    // This is the callback pattern again!
    mqttClient.setCallback(mqttCallback);
    Serial.println("MQTT client configured");
  }
}

// ========== WIFI HELPER FUNCTIONS ==========
// Check if IP address is valid (not 0.0.0.0 or 169.254.x.x)
bool hasValidIP() {
  IPAddress ip = WiFi.localIP();
  bool isZero = (ip[0] == 0 && ip[1] == 0 && ip[2] == 0 && ip[3] == 0);
  bool isAPIPA = (ip[0] == 169 && ip[1] == 254);
  return !(isZero || isAPIPA);
}

// Try to connect to WiFi with timeout and valid IP check
bool tryConnectWiFi(const char* ssid, const char* pass) {
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, pass);
  unsigned long start = millis();
  const unsigned long timeout = 4000; // 4 seconds
  
  while ((WiFi.status() != WL_CONNECTED || !hasValidIP()) && millis() - start < timeout) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED && hasValidIP()) {
    Serial.print("Connected! IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  
  Serial.println("Failed (no valid IP).");
  WiFi.disconnect();
  return false;
}



// ========== MQTT CALLBACK ==========
// This function is called when MQTT receives a message on subscribed topics
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT] Message received on topic: ");
  Serial.println(topic);
  
  // Convert payload to string
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("[MQTT] Message: ");
  Serial.println(message);
  
  // Check if message is from control topic
  if (String(topic) == MQTT_TOPIC_CONTROL) {
    handleCommand(message);
  }
}

// ========== MQTT RECONNECT ==========
// Reconnect to MQTT broker if connection is lost
void reconnectMQTT() {
  // Only try if WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  // Don't block - try once per call
  if (!mqttClient.connected()) {
    Serial.print("[MQTT] Attempting connection to ");
    Serial.print(MQTT_SERVER);
    Serial.print(":");
    Serial.println(MQTT_PORT);
    
    // Create unique client ID
    String clientId = "ArduinoR4-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("[MQTT] Connected successfully!");
      
      // Subscribe to control topic
      mqttClient.subscribe(MQTT_TOPIC_CONTROL);
      Serial.print("[MQTT] Subscribed to: ");
      Serial.println(MQTT_TOPIC_CONTROL);
    } else {
      Serial.print("[MQTT] Connection failed, rc=");
      Serial.println(mqttClient.state());
    }
  }
}

// ========== MQTT PUBLISH SENSOR DATA ==========
void publishSensorData(float temp, float hum, int led, int fan) {
  if (!mqttClient.connected()) {
    return;  // Skip if not connected
  }
  
  // Create JSON message
  String payload = "{";
  payload += "\"temperature\":"; payload += String(temp, 1);
  payload += ",\"humidity\":"; payload += String(hum, 1);
  payload += ",\"led\":"; payload += String(led);
  payload += ",\"fan\":"; payload += String(fan);
  payload += ",\"mode\":\""; 
  payload += (controlMode == MODE_AUTO) ? "AUTO" : "MANUAL";
  payload += "\"}";
  
  // Publish to MQTT broker
  if (mqttClient.publish(MQTT_TOPIC_SENSOR, payload.c_str())) {
    Serial.println("[MQTT] Published sensor data");
  } else {
    Serial.println("[MQTT] Publish failed");
  }
}

void handleCommand(String cmd) {
    cmd.trim();  // Remove whitespace
    
    // Parse MODE
    if (cmd.indexOf("MODE:AUTO") >= 0) {
        controlMode = MODE_AUTO;
        Serial.println("Switched to AUTO mode");
    }
    else if (cmd.indexOf("MODE:MANUAL") >= 0) {
        controlMode = MODE_MANUAL;
        // Reset to safe state when entering MANUAL mode
        manualLedOn = false;  // LED OFF
        manualFanSpeed = 0;   // Fan OFF
        Serial.println("Switched to MANUAL mode");
        Serial.println("Manual controls reset: LED=OFF, Fan=0");
    }
    
    // Parse LED (only affects manual mode)
    if (cmd.indexOf("LED:1") >= 0) {
        manualLedOn = true;
        Serial.println("Manual LED: ON");
    }
    else if (cmd.indexOf("LED:0") >= 0) {
        manualLedOn = false;
        Serial.println("Manual LED: OFF");
    }
    
    // Parse FAN (only affects manual mode)
    int fanIdx = cmd.indexOf("FAN:");
    if (fanIdx >= 0) {
        manualFanSpeed = cmd.substring(fanIdx + 4).toInt();
        manualFanSpeed = constrain(manualFanSpeed, 0, 255);  // Safety check
        Serial.print("Manual Fan Speed set to: ");
        Serial.println(manualFanSpeed);
    }
}

void sendSerialData(float temp, float hum, int led, int fan) {
  Serial.print("DATA:");
  Serial.print("temp=");
  Serial.print(temp, 1);
  Serial.print(",hum=");
  Serial.print(hum, 1);
  Serial.print(",led=");
  Serial.print(led == HIGH ? 1 : 0);
  Serial.print(",fan=");
  Serial.print(fan);
  Serial.print(",mode=");
  Serial.println(controlMode == MODE_AUTO ? "AUTO" : "MANUAL");
}

// ========== HTTP REQUEST HANDLER ==========
// This function handles incoming HTTP requests and sends sensor data
void handleHttpClient(float temp, float hum, int led, int fan) {
  // Check if a client (your backend) is trying to connect
  WiFiClient client = httpServer.available();
  
  if (client) {
    Serial.println("New HTTP client connected!");
    
    String request = "";
    
    // Read the HTTP request from the client
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        request += c;
        
        // HTTP request ends with a blank line
        if (request.endsWith("\r\n\r\n")) {
          break;
        }
      }
    }
    
    Serial.println("Request: " + request);
    
    // Check what the client is asking for
    if (request.indexOf("GET /data") >= 0) {
      // Client wants sensor data - send it!
      
      // HTTP Response Headers (tells client what type of data we're sending)
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: application/json");
      client.println("Access-Control-Allow-Origin: *");  // Allow browser access
      client.println("Connection: close");
      client.println();  // blank line separates headers from body
      
      // HTTP Response Body (the actual data in JSON format)
      client.print("{");
      client.print("\"temperature\":");
      client.print(temp, 1);
      client.print(",\"humidity\":");
      client.print(hum, 1);
      client.print(",\"led\":");
      client.print(led == HIGH ? 1 : 0);
      client.print(",\"fan\":");
      client.print(fan);
      client.print(",\"mode\":\"");
      client.print(controlMode == MODE_AUTO ? "AUTO" : "MANUAL");
      client.println("\"}");
      
      Serial.println("Data sent via HTTP!");
    }
    else if (request.indexOf("POST /command") >= 0) {
      // Client wants to send a command (MANUAL MODE)
      Serial.println("Received command via HTTP POST");
      
      // Extract command from request body
      // Body comes after "\r\n\r\n"
      int bodyStart = request.indexOf("\r\n\r\n");
      if (bodyStart >= 0) {
        String command = request.substring(bodyStart + 4);
        command.trim();
        
        Serial.print("Command: ");
        Serial.println(command);
        
        // Process the command
        handleCommand(command);
        
        // Send success response
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: text/plain");
        client.println("Access-Control-Allow-Origin: *");
        client.println("Connection: close");
        client.println();
        client.println("OK");
        
        Serial.println("Command processed successfully");
      } else {
        // No body found
        client.println("HTTP/1.1 400 Bad Request");
        client.println("Connection: close");
        client.println();
        Serial.println("No command body found");
      }
    }
    else if (request.indexOf("GET /ping") >= 0) {
      // Ping endpoint for connection test
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: text/plain");
      client.println("Access-Control-Allow-Origin: *");
      client.println("Connection: close");
      client.println();
      client.println("PONG");
      Serial.println("Ping received");
    }
    else if (request.indexOf("GET /") >= 0) {
      // Client accessed root page - send a simple welcome message
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: text/html");
      client.println("Connection: close");
      client.println();
      client.println("<!DOCTYPE HTML>");
      client.println("<html>");
      client.println("<h1>Arduino Smart Home System</h1>");
      client.println("<p>Sensor data available at: <a href='/data'>/data</a></p>");
      client.println("<p>Send commands to: POST /command</p>");
      client.println("</html>");
    }
    
    // Give the browser time to receive the data
    delay(10);
    
    // Close the connection
    client.stop();
    Serial.println("Client disconnected");
  }
}

void loop() {
  unsigned long now = millis();

  // ---------- 1. HANDLE TOUCH TOGGLE (edge detection) ----------
   static int lastTouchState = LOW;
   int touchState = digitalRead(TOUCH_PIN);

  if (touchState == HIGH && lastTouchState == LOW &&
      (now - lastTouchTime) > TOUCH_DEBOUNCE_DELAY) {

    systemOn = !systemOn;          // toggle ON/OFF
    lastTouchTime = now;

    if (!systemOn) {
      // turning OFF: clear display, turn backlight & LED & fan off
      lcd.clear();
      lcd.noBacklight();
      digitalWrite(LED_PIN, LOW);
      analogWrite(FAN_PIN, 0); // stop fan
      lastFanSpeed = 0; 
      Serial.println("System turned OFF");
    } else {
      // turning ON: backlight on and allow immediate reading
      lcd.backlight();
      Serial.println("System turned ON");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Waking up...");
      lastFanSpeed = 0; 
      // reset sensor timer so next loop WILL read
      lastReadTime = now - SENSOR_READ_INTERVAL;   // force immediate read next time
    }
  }
  lastTouchState = touchState;

  // ---------- 2. RECEIVE SERIAL COMMANDS (MANUAL CONTROL FROM UI) ----------
  if (Serial.available()) {
      String cmd = Serial.readStringUntil('\n');
      handleCommand(cmd);
  }

  // ---------- 3. IF SYSTEM OFF → DO NOTHING ----------
  if (!systemOn) {
    // small delay just to not hammer the CPU
    delay(100);
    return;
  }

  // ---------- 4. READ SENSOR ----------
  float h = dht.readHumidity();
  float t = dht.readTemperature();  // Celsius

  // if reading failed, just try again next loop
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(2000);
    return;
  }

  // ----- 5. LED LOGIC (humidity > 45%) + FAN SPEED LOGIC -----
  int targetLed = LOW;  // DEFAULT = OFF
  int targetFanSpeed = 0; // 0–255 (PWM)
  
  if (controlMode == MODE_AUTO) {
      // ----- LED logic -----
      if (h > 50.0) {
          targetLed = HIGH;     // LED ON
      } else {
          targetLed = LOW;      // LED OFF
      }
      // ----- Fan logic -----
      if (h <= 50.0) {
          targetFanSpeed = 0;
      } 
      else if (h <= 60.0) {
          targetFanSpeed = 90;
      } 
      else if (h <= 70.0) {
          targetFanSpeed = 150;
      } 
      else if (h <= 80.0) {
          targetFanSpeed = 200;
      } 
      else {
          targetFanSpeed = 255;
      }
  }
  else {
      // ===== Manual mode =====

      // manually set LED
      targetLed = manualLedOn ? HIGH : LOW;

      // manually set fan speed
      targetFanSpeed = manualFanSpeed;  // from dashboard slider/button
  }

  // APPLY to hardware
  digitalWrite(LED_PIN, targetLed);

  // prevent unnecessary PWM writes
  // only update PWM when speed changes
  if (targetFanSpeed != lastFanSpeed) {
    analogWrite(FAN_PIN, 255);
    delay(100);
    analogWrite(FAN_PIN, targetFanSpeed);
    
    lastFanSpeed = targetFanSpeed;
  }

  // ----- 6. PRINT TO SERIAL ------
  Serial.print("Temp: ");
  Serial.print(t);
  Serial.print(" C  Hum: ");
  Serial.print(h);
  Serial.println(" %");
  
  // Send data to backend via Serial (for Serial transport)
  sendSerialData(t, h, targetLed, targetFanSpeed);

  // ----- 6.1. HANDLE HTTP REQUESTS (for HTTP transport) -----
  if (currentMode == MODE_ONLINE) {
    handleHttpClient(t, h, targetLed, targetFanSpeed);
  }

  // ----- 6.2. MQTT COMMUNICATION (for MQTT transport) -----
  if (currentMode == MODE_ONLINE) {
    // Maintain MQTT connection
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    
    // Process incoming MQTT messages
    if (mqttClient.connected()) {
      mqttClient.loop();  // Check for incoming messages
      
      // Publish sensor data to MQTT broker
      publishSensorData(t, h, targetLed, targetFanSpeed);
    }
  }

  // ----- 7. print to LCD -----
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp:");
  lcd.print(t, 1);            // 1 decimal
  lcd.print("C");             // Removed degree symbol to fix "???????" issue

  lcd.setCursor(0, 1);
  lcd.print("Hum:");
  lcd.print(h, 1);
  lcd.print("%");

  delay(2000);  // wait 2 seconds
}
