# Arduino Code Organization Guide

## 📁 Recommended File Structure

```
smart_home_main/
├── smart_home_main.ino      ← Main program (must match folder name!)
├── config.h                 ← Your actual WiFi passwords (git-ignored)
├── config.example.h         ← Template for others to copy
├── wifi_helper.h            ← WiFi connection functions
├── mqtt_helper.h            ← MQTT functions
└── lcd_display.h            ← LCD helper functions (optional)
```

## 🔧 How to Use

### 1. **First Time Setup**
```bash
# Copy the example config
cd arduino/smart_home_main/
cp config.example.h config.h
# Edit config.h with your real WiFi credentials
```

### 2. **In Your Main .ino File**
```cpp
#include "config.h"        // Load all settings
#include "wifi_helper.h"   // WiFi functions
#include "mqtt_helper.h"   // MQTT functions

void setup() {
  // Use functions from helper files
  bool connected = connectToAvailableWiFi(
    WIFI_HOME_SSID, WIFI_HOME_PASS,
    WIFI_PHONE_SSID, WIFI_PHONE_PASS
  );
  
  if (connected) {
    connectToMQTT();
  }
}
```

## 📝 File Types Explained

| File Type | Purpose | Example |
|-----------|---------|---------|
| `.ino` | Main Arduino code | `smart_home_main.ino` |
| `.h` | Header files (functions, constants) | `config.h`, `wifi_helper.h` |
| `.cpp` + `.h` | C++ class implementations | `MyClass.cpp` + `MyClass.h` |

## ❓ FAQ

### Can I use `.ino` for helper files?
**Yes**, but `.h` is better because:
- ✅ Clear separation of concerns
- ✅ Can control what gets included where
- ✅ Standard C++ practice
- ✅ Works with other IDEs (PlatformIO, VS Code)

### Do I need to include helper files in Arduino IDE?
**No!** Arduino IDE automatically includes all files in the folder.

### How does Arduino combine files?
Arduino IDE internally does this:
```cpp
// File 1: smart_home_main.ino
#include <WiFiS3.h>
void setup() { ... }

// File 2: wifi_helper.h
bool connectToWiFi() { ... }

// Result: All combined into one program!
```

## 🔒 Security Best Practices

1. **Never commit `config.h`** - Added to `.gitignore`
2. **Always provide `config.example.h`** - So others know what to configure
3. **Use environment-based configs** - Different settings for dev/production

## 🎯 Benefits of Organization

✅ **Easier to find things** - WiFi code in `wifi_helper.h`, not scattered
✅ **Reusable** - Copy `wifi_helper.h` to other projects
✅ **Cleaner main file** - Focus on logic, not helper functions
✅ **Team-friendly** - Clear structure for collaborators
✅ **Secure** - Credentials in separate git-ignored file

## 📚 Next Steps (Optional)

Want even better organization? Consider:

1. **LCD Display Helper**
   ```cpp
   // lcd_display.h
   void displaySensorData(float temp, float hum);
   void displayStatus(const char* message);
   ```

2. **Sensor Helper**
   ```cpp
   // sensor_helper.h
   struct SensorData {
     float temperature;
     float humidity;
     bool isValid;
   };
   SensorData readSensors();
   ```

3. **PlatformIO** (Advanced)
   - Better than Arduino IDE for large projects
   - Built-in library management
   - Better build system
   - VS Code integration

## 🚀 Quick Migration Guide

To reorganize your existing code:

1. Create `config.h` with all credentials
2. Create `wifi_helper.h` with WiFi functions
3. Move WiFi functions from `.ino` to `wifi_helper.h`
4. Replace direct WiFi.begin() calls with helper functions
5. Test that everything still compiles and works!

**Pro tip**: Do this incrementally - one helper file at a time!
