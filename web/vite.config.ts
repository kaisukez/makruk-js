import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/makruk-js/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
