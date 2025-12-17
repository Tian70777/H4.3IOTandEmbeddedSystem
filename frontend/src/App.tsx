import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import SensorGrid from './components/SensorGrid'
import ControlPanel from './components/ControlPanel'
import Sidebar from './components/Sidebar'
import HistoricalAnalysis from './components/HistoricalAnalysis'
import LiveGraphs from './components/LiveGraphs'
import { useWebSocket } from './hooks/useWebSocket'
import { SensorData } from './types'

function App() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    led_status: 0,
    fan_speed: 0,
    control_mode: 'AUTO'
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'history' | 'live-graphs'>('dashboard')

  const { isConnected, sendCommand } = useWebSocket((data: SensorData) => {
    setSensorData(data)
    setLastUpdate(new Date())
  })

  return (
    <div className="app-wrapper">
      <Sidebar 
        onNavigate={setCurrentPage} 
        currentPage={currentPage} 
      />
      
      <div className="main-content">
        {currentPage === 'dashboard' ? (
          <div className="container">
            <Header />
            <StatusBar isConnected={isConnected} lastUpdate={lastUpdate} />
            <SensorGrid sensorData={sensorData} />
            <ControlPanel 
              currentMode={sensorData.control_mode} 
              sendCommand={sendCommand}
              isConnected={isConnected}
            />
          </div>
        ) : currentPage === 'history' ? (
          <HistoricalAnalysis />
        ) : (
          <LiveGraphs />
        )}
      </div>
    </div>
  )
}

export default App
