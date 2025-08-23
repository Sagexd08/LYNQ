// scripts/analyze-build.js
// This script sets up build analysis for visualizing bundle size

import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export a modified version of the main Vite config that includes the visualizer
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    // Increase the warning limit to avoid unnecessary warnings
    chunkSizeWarningLimit: 1000, // in kB
    
    // Configure Rollup options for better chunking
    rollupOptions: {
      output: {
        // Manual chunks configuration to split large dependencies
        manualChunks(id) {
          // Group React dependencies in one chunk
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Group Chart.js in its own chunk
          if (id.includes('node_modules/chart.js') || 
              id.includes('node_modules/react-chartjs-2')) {
            return 'chart-vendor';
          }
          
          // Group Aptos wallet adapter in its own chunk
          if (id.includes('node_modules/@aptos-labs/wallet-adapter-core') || 
              id.includes('node_modules/@aptos-labs/wallet-adapter-react')) {
            return 'aptos-vendor';
          }
          
          // Group wallet components
          if (id.includes('/components/wallet/')) {
            return 'wallet-components';
          }
          
          // Group dashboard components
          if (id.includes('/components/dashboard/')) {
            return 'dashboard-components';
          }
          
          // Group marketplace components
          if (id.includes('/components/marketplace/')) {
            return 'marketplace-components';
          }
          
          // Return undefined for everything else (default chunking)
          return undefined;
        }
      }
    }
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  
  // Resolve paths for better imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..', 'src')
    }
  }
});
