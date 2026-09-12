import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { realtimeApiPlugin } from './server/realtimePlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    realtimeApiPlugin(),
  ],
  server: {
    port: 5174,
    host: true,
    allowedHosts: true
  },
  preview: {
    port: 5174,
    host: true,
    allowedHosts: true
  }
})
