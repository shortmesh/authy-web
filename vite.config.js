import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy the widget script itself
      '/widget.js': {
        target: 'https://authy.shortmesh.com',
        changeOrigin: true,
        secure: true,
      },
      // Proxy the platform icons the widget loads relative to its own origin.
      // In dev, document.currentScript.src resolves to localhost, so these
      // paths would 404 without this proxy.
      '/WhatsApp.svg': {
        target: 'https://authy.shortmesh.com',
        changeOrigin: true,
        secure: true,
      },
      '/Logo.svg': {
        target: 'https://authy.shortmesh.com',
        changeOrigin: true,
        secure: true,
      },
      '/Signal-Logo.svg': {
        target: 'https://authy.shortmesh.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
