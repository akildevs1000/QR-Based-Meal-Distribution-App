import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` for production so assets use relative paths — required when
// loading the build via file:// inside Electron (or any non-root mount point).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  server: { port: 5173, host: true },
}))
