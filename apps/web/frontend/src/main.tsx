import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import './textures.css';
import './mobile-fix.css';

import App from './App';
import { configureFCL } from './config/flow';
import { queryClient } from './hooks/useQuery';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.');
}


configureFCL();
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
