import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-fifa': {
        target: 'https://api.football-data.org/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-fifa/, ''),
        headers: {
          'X-Auth-Token': '06206f13200e4e5d97e7054559c3e40d'
        }
      }
    }
  }
})
