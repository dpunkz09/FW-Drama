import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: {
    proxy: {
      '/api': {
        target: 'https://reelshort.vercel.app',
        changeOrigin: true,
        secure: true
      },
      '/search': {
        target: 'https://reelshort.vercel.app',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — changes rarely, long cache lifetime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // hls.js is ~500KB on its own; only needed on /watch
          'vendor-hls': ['hls.js'],
          // icon library
          'vendor-icons': ['lucide-react'],
        }
      }
    }
  }
})
