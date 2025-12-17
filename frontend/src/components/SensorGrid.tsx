import { SensorData } from '../types'
import SensorCard from './SensorCard'
import './SensorGrid.css'

interface SensorGridProps {
  sensorData: SensorData
}

const SensorGrid = ({ sensorData }: SensorGridProps) => {
  return (
    <div className="sensor-grid">
      <SensorCard
        type="temperature"
        icon="🌡️"
        title="Temperature"
        value={sensorData.temperature.toFixed(1)}
        unit="°C"
        label="Current room temperature"
      />
      
      <SensorCard
        type="humidity"
        icon="💧"
        title="Humidity"
        value={sensorData.humidity.toFixed(0)}
        unit="%"
        label="Relative humidity level"
      />
      
      <SensorCard
        type="led"
        icon="💡"
        title="LED Status"
        value={sensorData.led_status === 1 ? 'ON' : 'OFF'}
        unit=""
        label=""
        isLed={true}
        ledOn={sensorData.led_status === 1}
      />
      
      <SensorCard
        type="fan"
        icon="💨"
        title="Fan Speed"
        value={sensorData.fan_speed.toString()}
        unit="PWM"
        label=""
        isFan={true}
        fanSpeed={sensorData.fan_speed}
      />
    </div>
  )
}

export default SensorGrid
