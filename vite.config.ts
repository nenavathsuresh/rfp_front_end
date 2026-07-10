import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const defaultApiTarget = 'https://rf-8de94c3f4d344d93b5413a002d7e432d.ecs.eu-north-1.on.aws'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || defaultApiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})