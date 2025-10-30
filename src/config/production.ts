
export const prodConfig = {
  
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.coingecko.com/api/v3',
    timeout: 10000,
    retries: 3
  },
  
  
  performance: {
    enableVirtualScrolling: true,
    lazyLoadImages: true,
    debounceDelay: 300,
    cacheTimeout: 5 * 60 * 1000 
  },
  
  
  security: {
    enableCSP: true,
    sanitizeInputs: true,
    validateOrigins: true,
    maxRequestSize: '10mb'
  },
  
  
  features: {
    darkMode: true,
    offlineMode: false,
    analytics: process.env.NODE_ENV === 'production',
    debugMode: process.env.NODE_ENV === 'development'
  },
  
  
  errorReporting: {
    enabled: process.env.NODE_ENV === 'production',
    sampleRate: 0.1,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Script error.',
      'Network request failed'
    ]
  }
};


export const validateEnvironment = () => {
  const required = ['VITE_API_BASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }
  
  return missing.length === 0;
};
