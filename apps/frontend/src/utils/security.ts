


export const SECURITY_CONFIG = {
  
  CSP: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': ["'self'", "https://api.coingecko.com", "https://mainnet.infura.io", "https://sepolia.infura.io"],
    'font-src': ["'self'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
  },
  
  
  ALLOWED_APIS: [
    'https://api.coingecko.com/api/v3/coins/markets',
    'https://mainnet.infura.io/v3',
    'https://sepolia.infura.io/v3',
  ] as const,
  
  
  VALIDATION_PATTERNS: {
    address: /^0x[a-fA-F0-9]{40,64}$/,
    amount: /^\d+(\.\d{1,8})?$/,
    coinId: /^[a-z0-9-]+$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
  },
  
  
  RATE_LIMITS: {
    DEFAULT: { requests: 100, window: 60000 }, 
    API: { requests: 50, window: 60000 },      
  },
} as const;


type ValidationPattern = keyof typeof SECURITY_CONFIG.VALIDATION_PATTERNS;

interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  requests: number;
  window: number;
}


const rateLimitStore = new Map<string, RateLimitTracker>();


export const sanitizeInput = (input: unknown, type?: ValidationPattern): string => {
  
  if (input == null || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input.trim();
  
  
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') 
    .replace(/javascript:/gi, '') 
    .replace(/on\w+\s*=/gi, ''); 
  
  
  if (type && SECURITY_CONFIG.VALIDATION_PATTERNS[type]) {
    const pattern = SECURITY_CONFIG.VALIDATION_PATTERNS[type];
    if (!pattern.test(sanitized)) {
      throw new Error(`Invalid ${type} format: ${sanitized}`);
    }
  }
  
  return sanitized;
};


export const isAllowedApiEndpoint = (url: string): boolean => {
  try {
    new URL(url); 
    return SECURITY_CONFIG.ALLOWED_APIS.some(allowedEndpoint => 
      url.startsWith(allowedEndpoint)
    );
  } catch {
    return false;
  }
};


export const checkRateLimit = (identifier: string, limit: RateLimitConfig = SECURITY_CONFIG.RATE_LIMITS.DEFAULT): boolean => {
  const now = Date.now();
  const tracker = rateLimitStore.get(identifier);
  
  if (!tracker || now > tracker.resetTime) {
    
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + limit.window,
    });
    return true;
  }
  
  if (tracker.count >= limit.requests) {
    return false; 
  }
  
  tracker.count++;
  return true;
};


export const createSecureAbortController = (timeoutMs: number = 10000): { controller: AbortController; cleanup: () => void } => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
};


export const secureApiRequest = async (
  url: string, 
  options: ApiRequestOptions = {}
): Promise<Response> => {
  
  if (!isAllowedApiEndpoint(url)) {
    throw new Error(`Unauthorized API endpoint: ${url}`);
  }
  
  
  const rateLimitKey = new URL(url).hostname;
  if (!checkRateLimit(rateLimitKey, SECURITY_CONFIG.RATE_LIMITS.API)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  
  const { timeout = 10000, retries = 0, ...fetchOptions } = options;
  const { controller, cleanup } = createSecureAbortController(timeout);
  
  const secureOptions: RequestInit = {
    ...fetchOptions,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', 
      ...fetchOptions.headers,
    },
    
    credentials: 'same-origin',
  };
  
  try {
    const response = await fetch(url, secureOptions);
    cleanup();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    cleanup();
    
    
    if (retries > 0 && error instanceof TypeError) {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      return secureApiRequest(url, { ...options, retries: retries - 1 });
    }
    
    throw error;
  }
};


export const validateWalletAddress = (address: string): string => {
  return sanitizeInput(address, 'address');
};


export const validateAmount = (amount: string | number): string => {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  return sanitizeInput(amountStr, 'amount');
};


export const generateCSPHeader = (): string => {
  return Object.entries(SECURITY_CONFIG.CSP)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};


export const clearRateLimits = (): void => {
  rateLimitStore.clear();
};
