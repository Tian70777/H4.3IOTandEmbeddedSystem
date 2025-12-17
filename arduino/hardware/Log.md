**[Problem 1]**
At low humidity levels (e.g. 51%), the fan received a low PWM value.
This caused the fan to buzz but not rotate, because the motor did not have enough starting torque启动力矩.

Fix:
Added a short full-speed boost before setting the target PWM.
Now the code first applies analogWrite(FAN_PIN, 255), waits 100 ms,
then applies the calculated fan speed based on humidity.
This ensures reliable motor startup at all speeds.

Low PWM = not enough power to overcome friction 
Buzzing = motor tries to move but fails
255 boost = gives the motor a strong “push”
Then normal speed = smooth and stable control

**[Problem 2]**
WIFI mode, when wifi status changes, checks/reconnecting attempts are needed

Fix:




