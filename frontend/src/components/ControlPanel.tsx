import { useState } from 'react'
import './ControlPanel.css'

interface ControlPanelProps {
  currentMode: 'AUTO' | 'MANUAL'
  sendCommand: (command: string) => void
  isConnected: boolean
}

const ControlPanel = ({ currentMode, sendCommand, isConnected }: ControlPanelProps) => {
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>(currentMode)
  const [ledOn, setLedOn] = useState(false)
  const [fanSpeed, setFanSpeed] = useState(0)

  const handleModeChange = (newMode: 'AUTO' | 'MANUAL') => {
    setMode(newMode)
    sendCommand(`MODE:${newMode}`)
    
    // Reset controls when entering MANUAL mode
    if (newMode === 'MANUAL') {
      setLedOn(false)
      setFanSpeed(0)
      console.log('🎮 Entered MANUAL mode - Controls reset to OFF')
    }
  }

  const handleLedToggle = (checked: boolean) => {
    setLedOn(checked)
    sendCommand(`LED:${checked ? '1' : '0'}`)
  }

  const handleFanChange = (speed: number) => {
    setFanSpeed(speed)
    sendCommand(`FAN:${speed}`)
  }

  return (
    <div className="control-panel">
      <h2>⚙️ Control Panel</h2>
      
      <div className="mode-toggle">
        <button 
          className={`mode-btn ${mode === 'AUTO' ? 'active' : ''}`}
          onClick={() => handleModeChange('AUTO')}
          disabled={!isConnected}
        >
          🤖 AUTO Mode
        </button>
        <button 
          className={`mode-btn ${mode === 'MANUAL' ? 'active' : ''}`}
          onClick={() => handleModeChange('MANUAL')}
          disabled={!isConnected}
        >
          🎮 MANUAL Mode
        </button>
      </div>

      {mode === 'MANUAL' && (
        <div className="manual-controls">
          <div className="control-group">
            <label className="control-label">💡 LED Control</label>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={ledOn}
                onChange={(e) => handleLedToggle(e.target.checked)}
                disabled={!isConnected}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="control-group">
            <label className="control-label">💨 Fan Speed (PWM)</label>
            <input 
              type="range" 
              min="0" 
              max="255" 
              value={fanSpeed}
              className="fan-slider" 
              onChange={(e) => handleFanChange(Number(e.target.value))}
              disabled={!isConnected}
            />
            <div className="slider-value">
              Speed: {fanSpeed} / 255
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlPanel
