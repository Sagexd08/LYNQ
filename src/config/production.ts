// Production environment configuration
export const prodConfig = {
  // API Configuration
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.coingecko.com/api/v3',
    timeout: 10000,
    retries: 3
  },
  
  // Performance Configuration
  performance: {
    enableVirtualScrolling: true,
    lazyLoadImages: true,
    debounceDelay: 300,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes
  },
  
  // Security Configuration
  security: {
    enableCSP: true,
    sanitizeInputs: true,
    validateOrigins: true,
    maxRequestSize: '10mb'
  },
  
  // Feature Flags
  features: {
    darkMode: true,
    offlineMode: false,
    analytics: process.env.NODE_ENV === 'production',
    debugMode: process.env.NODE_ENV === 'development'
  },
  
  // Error Reporting
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

// Environment validation
export const validateEnvironment = () => {
  const required = ['VITE_API_BASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }
  
  return missing.length === 0;
};
