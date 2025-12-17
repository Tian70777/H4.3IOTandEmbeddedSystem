import { useState, useEffect, useRef } from 'react'
import './LiveGraphs.css'

interface SensorData {
  temperature: number
  humidity: number
  timestamp: number
}

const LiveGraphs = () => {
  const [temperatureData, setTemperatureData] = useState<number[]>([])
  const [humidityData, setHumidityData] = useState<number[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const canvasRefTemp = useRef<HTMLCanvasElement>(null)
  const canvasRefHum = useRef<HTMLCanvasElement>(null)

  const MAX_POINTS = 50

  // Load initial historical data from database
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/history?limit=50')
        const result = await response.json()
        
        console.log('📥 API Response:', result)
        
        if (result.data && result.data.length > 0) {
          // Extract and validate temperature and humidity arrays
          const temps = result.data
            .map((r: any) => parseFloat(r.temperature))
            .filter((val: number) => !isNaN(val) && isFinite(val))
          
          const hums = result.data
            .map((r: any) => parseFloat(r.humidity))
            .filter((val: number) => !isNaN(val) && isFinite(val))
          
          console.log(`📊 Loaded ${temps.length} temp points, ${hums.length} humidity points`)
          console.log('Sample temps:', temps.slice(0, 5))
          console.log('Sample hums:', hums.slice(0, 5))
          
          setTemperatureData(temps)
          setHumidityData(hums)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8080')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('📡 WebSocket connected for live graphs')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('📡 WebSocket message received:', message)
        
        // Extract sensor data from message (backend sends { type, data, timestamp })
        const sensorData = message.type === 'sensor_data' ? message.data : message
        
        // Validate and parse temperature
        const temp = parseFloat(String(sensorData.temperature))
        const hum = parseFloat(String(sensorData.humidity))
        
        if (!isNaN(temp) && isFinite(temp)) {
          setTemperatureData(prev => {
            const newData = [...prev, temp]
            return newData.slice(-MAX_POINTS)
          })
        } else {
          console.warn('Invalid temperature:', sensorData.temperature)
        }

        if (!isNaN(hum) && isFinite(hum)) {
          setHumidityData(prev => {
            const newData = [...prev, hum]
            return newData.slice(-MAX_POINTS)
          })
        } else {
          console.warn('Invalid humidity:', sensorData.humidity)
        }
      } catch (error) {
        console.error('Error parsing WebSocket data:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log('📡 WebSocket disconnected')
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [])

  // Draw temperature waveform
  useEffect(() => {
    if (!canvasRefTemp.current) return

    const canvas = canvasRefTemp.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 40

    // Clear canvas
    ctx.fillStyle = '#1e1e2e'
    ctx.fillRect(0, 0, width, height)

    // If no data yet, show waiting message
    if (temperatureData.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Waiting for data...', width / 2, height / 2)
      return
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (height - padding * 2)) / 5
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Calculate min/max for scaling
    const min = Math.min(...temperatureData)
    const max = Math.max(...temperatureData)
    const range = max - min || 1

    // Validate min/max are valid numbers
    if (!isFinite(min) || !isFinite(max)) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Invalid data', width / 2, height / 2)
      return
    }

    // Draw waveform
    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    temperatureData.forEach((value, index) => {
      const x = padding + (index / (MAX_POINTS - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw labels
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.fillText(`${max.toFixed(1)}°C`, 5, padding)
    ctx.fillText(`${min.toFixed(1)}°C`, 5, height - padding + 15)
    
    // Draw current value
    const currentValue = temperatureData[temperatureData.length - 1]
    if (currentValue !== undefined) {
      ctx.font = 'bold 16px monospace'
      ctx.fillStyle = '#ff6b6b'
      ctx.fillText(`${currentValue.toFixed(1)}°C`, width - 80, 30)
    }

  }, [temperatureData])

  // Draw humidity waveform
  useEffect(() => {
    if (!canvasRefHum.current) return

    const canvas = canvasRefHum.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 40

    // Clear canvas
    ctx.fillStyle = '#1e1e2e'
    ctx.fillRect(0, 0, width, height)

    // If no data yet, show waiting message
    if (humidityData.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Waiting for data...', width / 2, height / 2)
      return
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (height - padding * 2)) / 5
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Calculate min/max for scaling
    const min = Math.min(...humidityData)
    const max = Math.max(...humidityData)
    const range = max - min || 1

    // Validate min/max are valid numbers
    if (!isFinite(min) || !isFinite(max)) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Invalid data', width / 2, height / 2)
      return
    }

    // Draw waveform
    ctx.strokeStyle = '#4dabf7'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    humidityData.forEach((value, index) => {
      const x = padding + (index / (MAX_POINTS - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw labels
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.fillText(`${max.toFixed(1)}%`, 5, padding)
    ctx.fillText(`${min.toFixed(1)}%`, 5, height - padding + 15)
    
    // Draw current value
    const currentValue = humidityData[humidityData.length - 1]
    if (currentValue !== undefined) {
      ctx.font = 'bold 16px monospace'
      ctx.fillStyle = '#4dabf7'
      ctx.fillText(`${currentValue.toFixed(1)}%`, width - 80, 30)
    }

  }, [humidityData])

  return (
    <div className="live-graphs-container">
      <div className="graphs-header">
        <h1>📊 Live Sensor Waveforms</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="graphs-content">
        {/* Temperature Waveform */}
        <div className="waveform-card">
          <div className="waveform-header">
            <h2>🌡️ Temperature Waveform</h2>
            <span className="waveform-info">{MAX_POINTS} points • Real-time</span>
          </div>
          <div className="waveform-container">
            <canvas 
              ref={canvasRefTemp} 
              width={800} 
              height={300}
              className="waveform-canvas"
            />
          </div>
        </div>

        {/* Humidity Waveform */}
        <div className="waveform-card">
          <div className="waveform-header">
            <h2>💧 Humidity Waveform</h2>
            <span className="waveform-info">{MAX_POINTS} points • Real-time</span>
          </div>
          <div className="waveform-container">
            <canvas 
              ref={canvasRefHum} 
              width={800} 
              height={300}
              className="waveform-canvas"
            />
          </div>
        </div>
      </div>

      {!isConnected && (
        <div className="connection-warning">
          ⚠️ Not connected to sensor data. Make sure the backend server is running on port 8080.
        </div>
      )}
    </div>
  )
}

export default LiveGraphs
