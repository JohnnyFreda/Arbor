import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The backend port is configurable so Arbor does not fight another project for
// a well-known one. Override with ARBOR_API_PORT in the shell that runs both
// `npm run dev` and uvicorn -- they have to agree.
const API_PORT = process.env.ARBOR_API_PORT ?? '8420'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
