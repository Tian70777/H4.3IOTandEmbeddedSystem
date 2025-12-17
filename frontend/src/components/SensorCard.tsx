import { Suspense } from 'react'
import './SensorCard.css'
import Led3D from './Led3D'
import Fan3D from './Fan3D'

interface SensorCardProps {
  type: string
  icon: string
  title: string
  value: string
  unit: string
  label: string
  isLed?: boolean
  ledOn?: boolean
  isFan?: boolean
  fanSpeed?: number
}

const SensorCard = ({ 
  type, 
  icon, 
  title, 
  value, 
  unit, 
  label, 
  isLed = false, 
  ledOn = false,
  isFan = false,
  fanSpeed = 0
}: SensorCardProps) => {
  return (
    <div className={`sensor-card ${type}-card`}>
      <div className="card-header">
        <div className="card-icon">{icon}</div>
        <div className="card-title">{title}</div>
      </div>

      {isLed && (
        <div className="led-3d-container">
          <Suspense fallback={
            <div style={{ 
              width: '50px', 
              height: '50px', 
              margin: '0 auto',
              borderRadius: '50%',
              background: ledOn ? '#fbbf24' : '#4b5563'
            }} />
          }>
            <Led3D isOn={ledOn} />
          </Suspense>
        </div>
      )}

      {isFan && (
        <div className="fan-3d-container">
          <Suspense fallback={<div style={{ textAlign: 'center', fontSize: '2em' }}>🌀</div>}>
            <Fan3D speed={fanSpeed} />
          </Suspense>
        </div>
      )}

      <div className="card-value">{value}</div>
      {unit && <div className="card-unit">{unit}</div>}

      {isFan && (
        <div className="speed-bar">
          <div 
            className="speed-fill" 
            style={{ width: `${(fanSpeed / 255) * 100}%` }}
          ></div>
        </div>
      )}

      {label && <div className="card-label">{label}</div>}
    </div>
  )
}

export default SensorCard
