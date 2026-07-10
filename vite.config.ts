import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://rf-8de94c3f4d344d93b5413a002d7e432d.ecs.eu-north-1.on.aws/',
        changeOrigin: true,
      },
    },
  },
})