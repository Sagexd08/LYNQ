import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@landing': path.resolve(__dirname, './src/landing'),
      '@app': path.resolve(__dirname, './src/app'),
      '@components': path.resolve(__dirname, './src/shared/components'),
      '@services': path.resolve(__dirname, './src/shared/services'),
      '@store': path.resolve(__dirname, './src/shared/store'),
      '@config': path.resolve(__dirname, './src/shared/config'),
      '@hooks': path.resolve(__dirname, './src/shared/hooks'),
      '@utils': path.resolve(__dirname, './src/shared/utils'),
      '@types': path.resolve(__dirname, './src/shared/types'),
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
