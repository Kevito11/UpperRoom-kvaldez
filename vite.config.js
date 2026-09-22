import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/conferencia_despierta_upperroon/',
  plugins: [react()],
})
