# Security Risk Analysis - Smart Home IoT Project

## 1. Public MQTT Broker - No Authentication
Using free public broker `broker.hivemq.com`, anyone can read sensor data and control devices.

Fix: 
Add authentication and password protection. Use complicated password.

## 2. Unencrypted MQTT Traffic (Port 1883)
Plain text data, without any form of encryption. Sensor data visible to public network, commands can be intercepted and modified.

port: 1883, 
useSSL: false

Fix:
Use Encrypted Port 8883

## 3. No User Authentication
No user authentication, no password protection

Fix:
Add user authentication system.

## 4. Unencrypted WebSocket (ws://)

`ws://localhost:8080` instead of `wss://`
Data visible on local network

Fix:
Use wss://

## 5. Unencrypted HTTP API
http, Historical data sent unencrypted

Fix:
Use https

---

## 6. No Database Encryption
Sensor readings stored in plain text, historical data readable if database accessed

## 7. Firmware update
