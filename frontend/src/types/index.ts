export interface SensorData {
  temperature: number
  humidity: number
  led_status: number
  fan_speed: number
  control_mode: 'AUTO' | 'MANUAL'
}

export interface WebSocketMessage {
  type: string
  data?: SensorData
  command?: string
}
