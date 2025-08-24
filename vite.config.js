import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';
  
  // Base configuration
  const config = {
    plugins: [react()],
    build: {
      // Increase the warning limit to avoid unnecessary warnings
      chunkSizeWarningLimit: 2000, // in kB - increased for large 3D libraries
      
      // Configure Rollup options for better chunking
      rollupOptions: {
        output: {
          // Manual chunks configuration to split large dependencies
          manualChunks: (id) => {
            // Group React dependencies in one chunk
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            
            // Group Chart.js in its own chunk
            if (id.includes('node_modules/chart.js') || 
                id.includes('node_modules/react-chartjs-2') ||
                id.includes('node_modules/recharts')) {
              return 'chart-vendor';
            }
            
            // Group Web3 and blockchain dependencies
            if (id.includes('node_modules/ethers') || 
                id.includes('node_modules/@metamask') ||
                id.includes('node_modules/@coinbase') ||
                id.includes('node_modules/axios')) {
              return 'web3-vendor';
            }
            
            // Split animation libraries into smaller chunks
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-motion';
            }
            
            if (id.includes('node_modules/@splinetool')) {
              return 'spline-vendor';
            }
            
            // Group UI libraries
            if (id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/react-icons') ||
                id.includes('node_modules/react-hot-toast') ||
                id.includes('node_modules/react-scroll')) {
              return 'ui-vendor';
            }
            
            // Split physics and 3D libraries into separate chunks
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
            
            // Group crypto and mathematical libraries
            if (id.includes('node_modules/poseidon') ||
                id.includes('node_modules/uuid') ||
                id.includes('node_modules/crypto') ||
                id.includes('boolean')) {
              return 'crypto-vendor';
            }
            
            // Group audio libraries
            if (id.includes('node_modules/howler')) {
              return 'audio-vendor';
            }
            
            // Group typography and fonts
            if (id.includes('opentype') ||
                id.includes('font')) {
              return 'typography-vendor';
            }
            
            // Group other large vendor libraries
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
    
    // Optimize dependency pre-bundling
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion']
    },
    
    // Resolve paths for better imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  };
  
  // Add visualizer plugin in analyze mode
  if (isAnalyze) {
    try {
      // Dynamically import visualizer
      const visualizer = require('rollup-plugin-visualizer').visualizer;
      config.plugins.push(
        visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        })
      );
    } catch (e) {
      console.warn('Visualizer plugin not found. Run `npm run analyze:install` first.');
    }
  }
  
  return config;
});
