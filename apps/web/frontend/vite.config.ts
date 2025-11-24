import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/chart.js') || 
              id.includes('node_modules/react-chartjs-2') ||
              id.includes('node_modules/recharts')) {
            return 'chart-vendor';
          }
          if (id.includes('node_modules/ethers') || 
              id.includes('node_modules/@metamask') ||
              id.includes('node_modules/@coinbase')) {
            return 'web3-vendor';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          if (id.includes('node_modules/@splinetool')) {
            return 'spline-vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
