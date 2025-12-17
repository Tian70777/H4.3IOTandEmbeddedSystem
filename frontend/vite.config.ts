import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true, // Allow external access
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io'], // Allow ngrok domains
    proxy: {
      // Proxy WebSocket through same ngrok tunnel
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  }
})
