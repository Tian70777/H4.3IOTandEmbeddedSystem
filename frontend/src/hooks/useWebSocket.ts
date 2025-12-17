import { useEffect, useRef, useState } from 'react'
import { SensorData, WebSocketMessage } from '../types'

// Auto-detect WebSocket URL based on environment
const getWebSocketURL = () => {
  // If custom URL provided, use it
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }
  
  // Local development
  if (window.location.hostname === 'localhost') {
    return 'ws://localhost:8080'
  }
  
  // ngrok or remote access - use wss with same host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

const WS_URL = getWebSocketURL()

export const useWebSocket = (onMessage: (data: SensorData) => void) => {
  const [isConnected, setIsConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<number>()

  const connect = () => {
    try {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected')
        setIsConnected(true)
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('📥 Received:', message)

          if (message.type === 'sensor_data' && message.data) {
            onMessage(message.data)
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      ws.current.onclose = () => {
        console.log('❌ WebSocket disconnected')
        setIsConnected(false)
        
        // Reconnect after 3 seconds
        reconnectTimeout.current = window.setTimeout(() => {
          console.log('🔄 Reconnecting...')
          connect()
        }, 3000)
      }

      ws.current.onerror = (error) => {
        console.error('⚠️ WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  const sendCommand = (command: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'command',
        command: command
      }))
      console.log('📤 Sent command:', command)
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  return { isConnected, sendCommand }
}
