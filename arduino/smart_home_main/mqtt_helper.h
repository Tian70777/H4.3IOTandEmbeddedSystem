// mqtt_helper.h
// MQTT connection and message handling functions

#ifndef MQTT_HELPER_H
#define MQTT_HELPER_H

#include <PubSubClient.h>

// External references (defined in main .ino)
extern PubSubClient mqttClient;
extern void mqttCallback(char* topic, byte* payload, unsigned int length);

// Connect to MQTT broker
bool connectToMQTT(const char* clientId = "ArduinoClient") {
  Serial.print("Connecting to MQTT broker...");
  
  if (mqttClient.connect(clientId)) {
    Serial.println(" ✅ Connected!");
    return true;
  } else {
    Serial.print(" ❌ Failed, rc=");
    Serial.println(mqttClient.state());
    return false;
  }
}

// Reconnect to MQTT with retry logic
void reconnectMQTT(const char* controlTopic) {
  // Try to reconnect if not connected
  if (!mqttClient.connected()) {
    Serial.println("MQTT disconnected, reconnecting...");
    
    if (connectToMQTT()) {
      // Subscribe to control topic
      mqttClient.subscribe(controlTopic);
      Serial.print("Subscribed to: ");
      Serial.println(controlTopic);
    } else {
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

// Publish sensor data as JSON
void publishSensorData(const char* topic, float temp, float hum, int led, int fan, const char* mode) {
  char jsonBuffer[150];
  snprintf(jsonBuffer, sizeof(jsonBuffer),
    "{\"temperature\":%.1f,\"humidity\":%.1f,\"led\":%d,\"fan\":%d,\"mode\":\"%s\"}",
    temp, hum, led, fan, mode
  );
  
  if (mqttClient.publish(topic, jsonBuffer)) {
    Serial.print("📤 Published: ");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("❌ Publish failed!");
  }
}

#endif
