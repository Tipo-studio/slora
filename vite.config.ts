import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/sivitai-api': {
        target: process.env.VITE_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://sivitai-api.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sivitai-api/, ''),
      },
    },
  },
})
