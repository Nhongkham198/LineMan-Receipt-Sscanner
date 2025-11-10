import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This safely exposes the environment variable to the client-side code
    // by replacing `process.env.API_KEY` with the actual value at build time.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
