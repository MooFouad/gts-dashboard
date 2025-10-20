import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Exit if port is already in use
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Using esbuild (faster and included with Vite)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'xlsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
