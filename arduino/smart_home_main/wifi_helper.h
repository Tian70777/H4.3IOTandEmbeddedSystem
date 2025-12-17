// wifi_helper.h
// WiFi connection and management functions

#ifndef WIFI_HELPER_H
#define WIFI_HELPER_H

#include <WiFiS3.h>

// Try to connect to a WiFi network
bool connectToWiFi(const char* ssid, const char* password, int timeout = 10000) {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startTime) < timeout) {
    delay(500);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("\n❌ WiFi Connection Failed");
    return false;
  }
}

// Try multiple WiFi networks (home first, then hotspot)
bool connectToAvailableWiFi(const char* ssid1, const char* pass1, 
                            const char* ssid2, const char* pass2) {
  // Try home WiFi first
  if (connectToWiFi(ssid1, pass1)) {
    return true;
  }
  
  Serial.println("Trying backup WiFi...");
  delay(1000);
  
  // Try phone hotspot as backup
  if (connectToWiFi(ssid2, pass2)) {
    return true;
  }
  
  return false;
}

// Check WiFi connection status
bool isWiFiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

// Get WiFi signal strength (RSSI)
int getWiFiStrength() {
  return WiFi.RSSI();
}

#endif
