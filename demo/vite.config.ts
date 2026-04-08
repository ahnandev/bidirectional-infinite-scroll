import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/bidirectional-infinite-scroll/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
