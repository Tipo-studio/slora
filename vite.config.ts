import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/sivitai-api': {
        target: 'https://sivitai-api.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sivitai-api/, ''),
      },
    },
  },
})
