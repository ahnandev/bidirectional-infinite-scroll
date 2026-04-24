import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/bidirectional-infinite-scroll/',
  plugins: [react()],
  resolve: {
    alias: {
      '@ahnandev/bidirectional-infinite-scroll': fileURLToPath(
        new URL('../src/index.ts', import.meta.url),
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
      },
    },
  },
})
