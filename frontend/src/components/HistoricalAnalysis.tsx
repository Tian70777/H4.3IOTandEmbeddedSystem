import { useState, useEffect } from 'react'
import './HistoricalAnalysis.css'

interface HistoricalData {
  id: number
  timestamp: string
  temperature: number
  humidity: number
  led_status: number
  fan_speed: number
  control_mode: string
}

interface Statistics {
  total_readings: number
  avg_temp: number
  min_temp: number
  max_temp: number
  avg_humidity: number
  min_humidity: number
  max_humidity: number
  avg_fan_speed: number
  led_on_count: number
  led_on_percentage: number
  fan_runtime_hours: number
  estimated_kwh: number
}

const HistoricalAnalysis = () => {
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistoricalData()
  }, [days])

  const fetchHistoricalData = async () => {
    setLoading(true)
    setError(null)

    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const response = await fetch(
        `http://localhost:3000/api/history/analytics?` +
        `start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch historical data')
      }

      const data = await response.json()
      setStatistics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching historical data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number | null | undefined, decimals = 1): string => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A'
    return Number(num).toFixed(decimals)
  }

  return (
    <div className="historical-analysis">
      <div className="analysis-header">
        <h1>📈 Historical Analysis</h1>
        <p className="subtitle">Analyze your smart home's performance over time</p>
      </div>

      <div className="filter-section">
        <label htmlFor="days-filter">
          <span className="filter-icon">📅</span>
          Time Period:
        </label>
        <select 
          id="days-filter"
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="days-selector"
        >
          <option value={1}>Last 24 Hours</option>
          <option value={3}>Last 3 Days</option>
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
        <button onClick={fetchHistoricalData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading historical data...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>⚠️ Error: {error}</p>
          <button onClick={fetchHistoricalData} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && statistics && (
        <div className="statistics-grid">
          {/* Overview Card */}
          <div className="stat-card overview-card">
            <div className="card-header">
              <h3>📊 Overview</h3>
            </div>
            <div className="card-content">
              <div className="stat-item">
                <span className="stat-label">Total Readings:</span>
                <span className="stat-value">{statistics.total_readings}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time Period:</span>
                <span className="stat-value">{days} {days === 1 ? 'Day' : 'Days'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Data Points per Day:</span>
                <span className="stat-value">
                  {formatNumber(statistics.total_readings / days, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Temperature Card */}
          <div className="stat-card temperature-card">
            <div className="card-header">
              <h3>🌡️ Temperature</h3>
            </div>
            <div className="card-content">
              <div className="stat-item">
                <span className="stat-label">Average:</span>
                <span className="stat-value highlight">
                  {formatNumber(statistics.avg_temp)}°C
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Minimum:</span>
                <span className="stat-value">{formatNumber(statistics.min_temp)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Maximum:</span>
                <span className="stat-value">{formatNumber(statistics.max_temp)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Range:</span>
                <span className="stat-value">
                  {formatNumber(statistics.max_temp - statistics.min_temp)}°C
                </span>
              </div>
            </div>
          </div>

          {/* Humidity Card */}
          <div className="stat-card humidity-card">
            <div className="card-header">
              <h3>💧 Humidity</h3>
            </div>
            <div className="card-content">
              <div className="stat-item">
                <span className="stat-label">Average:</span>
                <span className="stat-value highlight">
                  {formatNumber(statistics.avg_humidity)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Minimum:</span>
                <span className="stat-value">{formatNumber(statistics.min_humidity)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Maximum:</span>
                <span className="stat-value">{formatNumber(statistics.max_humidity)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Range:</span>
                <span className="stat-value">
                  {formatNumber(statistics.max_humidity - statistics.min_humidity)}%
                </span>
              </div>
            </div>
          </div>

          {/* LED Usage Card */}
          <div className="stat-card led-card">
            <div className="card-header">
              <h3>💡 LED Usage</h3>
            </div>
            <div className="card-content">
              <div className="stat-item">
                <span className="stat-label">Times Turned ON:</span>
                <span className="stat-value highlight">
                  {statistics.led_on_count}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">ON Percentage:</span>
                <span className="stat-value">
                  {formatNumber(statistics.led_on_percentage)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">OFF Percentage:</span>
                <span className="stat-value">
                  {formatNumber(100 - statistics.led_on_percentage)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Est. Energy (5W LED):</span>
                <span className="stat-value">
                  {formatNumber((statistics.led_on_percentage / 100) * days * 24 * 5 / 1000, 3)} kWh
                </span>
              </div>
            </div>
          </div>

          {/* Fan Usage Card */}
          <div className="stat-card fan-card">
            <div className="card-header">
              <h3>🌀 Fan Usage</h3>
            </div>
            <div className="card-content">
              <div className="stat-item">
                <span className="stat-label">Average Speed:</span>
                <span className="stat-value highlight">
                  {formatNumber(statistics.avg_fan_speed)} PWM
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average %:</span>
                <span className="stat-value">
                  {formatNumber((statistics.avg_fan_speed / 255) * 100)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Runtime (est.):</span>
                <span className="stat-value">
                  {formatNumber(statistics.fan_runtime_hours)} hours
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Est. Energy (12W fan):</span>
                <span className="stat-value">
                  {formatNumber(statistics.estimated_kwh, 3)} kWh
                </span>
              </div>
            </div>
          </div>

          {/* Energy Summary Card */}
          <div className="stat-card energy-card">
            <div className="card-header">
              <h3>⚡ Energy Summary</h3>
            </div>
            <div className="card-content">
              <div className="stat-item">
                <span className="stat-label">Fan Energy:</span>
                <span className="stat-value">
                  {formatNumber(statistics.estimated_kwh, 3)} kWh
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">LED Energy:</span>
                <span className="stat-value">
                  {formatNumber((statistics.led_on_percentage / 100) * days * 24 * 5 / 1000, 3)} kWh
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Energy:</span>
                <span className="stat-value highlight">
                  {formatNumber(
                    statistics.estimated_kwh + 
                    (statistics.led_on_percentage / 100) * days * 24 * 5 / 1000, 
                    3
                  )} kWh
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Est. Cost (2.24 DKK/kWh):</span>
                <span className="stat-value">
                  {formatNumber(
                    (statistics.estimated_kwh + 
                    (statistics.led_on_percentage / 100) * days * 24 * 5 / 1000) * 2.24,
                    2
                  )} DKK
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !statistics && (
        <div className="empty-state">
          <p>📊 No data available for the selected period</p>
          <p className="empty-subtitle">Try selecting a different time range</p>
        </div>
      )}
    </div>
  )
}

export default HistoricalAnalysis
