### **1 ULC2003 and DC motor wiring**
**1. Old Wiring (Incorrect Setup)**
Arduino 5V → breadboard +
ULN2003 VCC/+ → breadboard +
Battery + → motor red wire (directly)
Motor black → ULN2003 OUT3
Arduino GND, ULN2003 GND, and battery – were all connected in breadboard -

**What this caused:**
Because Arduino 5V and battery 9V were indirectly connected through the ULN2003 and the motor, the 9V power back-fed into the 5V logic side.

**Symptoms:**
LCD turned ON even when Arduino was not powered
When using a 9V batttery, fan kept spinning even when PWM = 0, Humidity logic was ignored

Arduino received “ghost power” through ULN2003’s internal diodes

**Why this happens:**
The ULN2003 contains flyback diodes.
These diodes + motor coil created an unwanted voltage path:

Battery + → Motor → ULN2003 diodes → Arduino 5V rail

This “side path” allowed the 9V battery to feed the 5V rail (not fully, but enough to cause chaos).

So:
Logic signals became unstable
Motor received unintended current
Arduino behaved unpredictably

**Why 6.5V looked OK but 9V failed**
The same bug existed with both voltages.

But:
Battery	Effect
6.5V	Backfeed voltage too weak to fully power LCD / override logic
9V	Strong backfeed → LCD lights up, Arduino half-powered, fan ignores control

So 6.5V “seemed fine” only because the error was not strong enough to show.

**2. New Wiring**
New wiring layout

Battery + → ULN2003 motor +

Battery – → breadboard –

Motor red → ULN2003 motor + (pin 1 in white connector) 

Motor black → ULN2003 OUT3 (C)

Arduino 5V → breadboard + (logic ONLY)

Arduino GND → breadboard –

ULN2003 GND → breadboard –

This means:

Battery + and Motor red are connected together at ULN2003 motor +

The motor always receives +V from the battery

ULN2003 only decides whether the motor gets GND or not


**Logic power (Arduino side only)**

Arduino 5V → breadboard + (logic ONLY: LCD, DHT, touch, ULN2003 logic pins)

Important:
Battery + is NO LONGER connected to the breadboard +

**Why this wiring is electrically correct** 

Now the system is cleanly separated:

Battery only powers the motor

Arduino 5V only powers logic

ULN2003 acts as a safe low-side switch

When Arduino outputs PWM on IN3:

ULN2003 connects Motor black to GND

Current flows:

Battery + → ULN2003 → Motor→ GND


When PWM = 0:

ULN2003 disconnects GND

Circuit is open → motor stops

No current can leak into Arduino 5V anymore.
No ghost power.
No uncontrolled spinning.

✅ 为什么这样接是正确的（中文）

现在电路被正确分成三部分：

电池只负责给马达供电
Arduino 5V 只负责逻辑（LCD、传感器、控制）
ULN2003 只负责“接地开关”

当 Arduino 在 IN3 输出 PWM：
电池 + → 马达 → ULN2003 → 地
马达就会转。

当 PWM = 0：
ULN2003 不再接地
回路断开
马达停止 