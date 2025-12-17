import './StatusBar.css'

interface StatusBarProps {
  isConnected: boolean
  lastUpdate: Date | null
}

const StatusBar = ({ isConnected, lastUpdate }: StatusBarProps) => {
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--'
    return date.toLocaleTimeString()
  }

  return (
    <div className="status-bar">
      <div className="connection-info">
        <div className={`status-dot ${isConnected ? 'connected' : ''}`}></div>
        <div>
          <strong>{isConnected ? '🟢 Connected' : '🔴 Disconnected'}</strong>
        </div>
      </div>
      <div className="last-update">
        Last update: <span>{formatTime(lastUpdate)}</span>
      </div>
    </div>
  )
}

export default StatusBar
