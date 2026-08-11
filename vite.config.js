import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves the app under /class_plan-inator/, not /; the deploy
  // workflow sets VITE_BASE_PATH so asset URLs resolve. Dev stays at /.
  base: process.env.VITE_BASE_PATH || '/',
  server: { port: Number(process.env.PORT) || 5174 },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
