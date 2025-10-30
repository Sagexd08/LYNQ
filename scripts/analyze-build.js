


import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
    
    chunkSizeWarningLimit: 1000, 
    
    
    rollupOptions: {
      output: {
        
        manualChunks(id) {
          
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          
          if (id.includes('node_modules/chart.js') || 
              id.includes('node_modules/react-chartjs-2')) {
            return 'chart-vendor';
          }
          
          
          if (id.includes('node_modules/@aptos-labs/wallet-adapter-core') || 
              id.includes('node_modules/@aptos-labs/wallet-adapter-react')) {
            return 'aptos-vendor';
          }
          
          
          if (id.includes('/components/wallet/')) {
            return 'wallet-components';
          }
          
          
          if (id.includes('/components/dashboard/')) {
            return 'dashboard-components';
          }
          
          
          if (id.includes('/components/marketplace/')) {
            return 'marketplace-components';
          }
          
          
          return undefined;
        }
      }
    }
  },
  
  
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..', 'src')
    }
  }
});
