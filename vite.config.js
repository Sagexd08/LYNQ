import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';
  
  
  const config = {
    plugins: [react()],
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
                id.includes('node_modules/@coinbase') ||
                id.includes('node_modules/axios')) {
              return 'web3-vendor';
            }
            
            
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-motion';
            }
            
            if (id.includes('node_modules/@splinetool')) {
              return 'spline-vendor';
            }
            
            
            if (id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/react-icons') ||
                id.includes('node_modules/react-hot-toast') ||
                id.includes('node_modules/react-scroll')) {
              return 'ui-vendor';
            }
            
            
            if (id.includes('physics')) {
              return 'physics-vendor';
            }
            
            if (id.includes('three') || id.includes('cannon')) {
              return 'three-vendor';
            }
            
            if (id.includes('rapier')) {
              return 'rapier-vendor';
            }
            
            if (id.includes('navmesh')) {
              return 'navmesh-vendor';
            }
            
            if (id.includes('gaussian-splat')) {
              return 'gaussian-vendor';
            }
            
            
            if (id.includes('node_modules/poseidon') ||
                id.includes('node_modules/uuid') ||
                id.includes('node_modules/crypto') ||
                id.includes('boolean')) {
              return 'crypto-vendor';
            }
            
            
            if (id.includes('node_modules/howler')) {
              return 'audio-vendor';
            }
            
            
            if (id.includes('opentype') ||
                id.includes('font')) {
              return 'typography-vendor';
            }
            
            
            if (id.includes('node_modules') && 
                !id.includes('react') &&
                !id.includes('chart') &&
                !id.includes('framer-motion') &&
                !id.includes('@splinetool') &&
                !id.includes('lucide-react')) {
              return 'vendor';
            }
          }
        }
      }
    },
    
    
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion']
    },
    
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/store': path.resolve(__dirname, 'src/store'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/api': path.resolve(__dirname, 'src/api'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
      }
    }
  };
  
  
  if (isAnalyze) {
    try {
      
      const visualizer = require('rollup-plugin-visualizer').visualizer;
      config.plugins.push(
        visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        })
      );
    } catch {
      console.warn('Visualizer plugin not found. Run `npm run analyze:install` first.');
    }
  }
  
  return config;
});
