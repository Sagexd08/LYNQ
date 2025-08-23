import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Import CSS in order of specificity
import './index.css';
import './textures.css';
import './mobile-fix.css';

import App from './App';

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.');
}

// Create root and render app
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
