import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';


import './index.css';
import './textures.css';
import './mobile-fix.css';

import App from './App';
import { configureFCL } from './config/flow';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.');
}


configureFCL();
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
