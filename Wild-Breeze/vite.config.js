import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy Printful API requests to bypass CORS
      '/api/printful': {
        target: 'https://api.printful.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/printful/, ''),
        secure: true
      }
    }
  }
})

