/**
 * Security utilities for API requests, input validation, and data sanitization
 */

// Security configuration constants
export const SECURITY_CONFIG = {
  // Content Security Policy directives
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
  
  // Allowed API endpoints (whitelist)
  ALLOWED_APIS: [
    'https://api.coingecko.com/api/v3/coins/markets',
    'https://mainnet.infura.io/v3',
    'https://sepolia.infura.io/v3',
  ] as const,
  
  // Input validation patterns
  VALIDATION_PATTERNS: {
    address: /^0x[a-fA-F0-9]{40,64}$/,
    amount: /^\d+(\.\d{1,8})?$/,
    coinId: /^[a-z0-9-]+$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
  },
  
  // Rate limiting configuration
  RATE_LIMITS: {
    DEFAULT: { requests: 100, window: 60000 }, // 100 requests per minute
    API: { requests: 50, window: 60000 },      // 50 API requests per minute
  },
} as const;

// Type definitions
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

// Rate limiting storage
const rateLimitStore = new Map<string, RateLimitTracker>();

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input: unknown, type?: ValidationPattern): string => {
  // Handle null/undefined/non-string inputs
  if (input == null || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input.trim();
  
  // Remove potential script tags and HTML
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  
  // Validate against pattern if provided
  if (type && SECURITY_CONFIG.VALIDATION_PATTERNS[type]) {
    const pattern = SECURITY_CONFIG.VALIDATION_PATTERNS[type];
    if (!pattern.test(sanitized)) {
      throw new Error(`Invalid ${type} format: ${sanitized}`);
    }
  }
  
  return sanitized;
};

/**
 * Validates if the provided URL is in the allowed API endpoints
 */
export const isAllowedApiEndpoint = (url: string): boolean => {
  try {
    new URL(url); // Validate URL format
    return SECURITY_CONFIG.ALLOWED_APIS.some(allowedEndpoint => 
      url.startsWith(allowedEndpoint)
    );
  } catch {
    return false;
  }
};

/**
 * Implements rate limiting for API requests
 */
export const checkRateLimit = (identifier: string, limit: RateLimitConfig = SECURITY_CONFIG.RATE_LIMITS.DEFAULT): boolean => {
  const now = Date.now();
  const tracker = rateLimitStore.get(identifier);
  
  if (!tracker || now > tracker.resetTime) {
    // Reset or create new tracker
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + limit.window,
    });
    return true;
  }
  
  if (tracker.count >= limit.requests) {
    return false; // Rate limit exceeded
  }
  
  tracker.count++;
  return true;
};

/**
 * Creates a secure AbortController with timeout
 */
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

/**
 * Secure API request wrapper with validation, rate limiting, and error handling
 */
export const secureApiRequest = async (
  url: string, 
  options: ApiRequestOptions = {}
): Promise<Response> => {
  // Validate URL
  if (!isAllowedApiEndpoint(url)) {
    throw new Error(`Unauthorized API endpoint: ${url}`);
  }
  
  // Check rate limit
  const rateLimitKey = new URL(url).hostname;
  if (!checkRateLimit(rateLimitKey, SECURITY_CONFIG.RATE_LIMITS.API)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Setup secure request options
  const { timeout = 10000, retries = 0, ...fetchOptions } = options;
  const { controller, cleanup } = createSecureAbortController(timeout);
  
  const secureOptions: RequestInit = {
    ...fetchOptions,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      ...fetchOptions.headers,
    },
    // Ensure credentials are not sent to third-party APIs
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
    
    // Retry logic for network errors (but not for client/server errors)
    if (retries > 0 && error instanceof TypeError) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      return secureApiRequest(url, { ...options, retries: retries - 1 });
    }
    
    throw error;
  }
};

/**
 * Validates and sanitizes wallet address
 */
export const validateWalletAddress = (address: string): string => {
  return sanitizeInput(address, 'address');
};

/**
 * Validates and sanitizes transaction amounts
 */
export const validateAmount = (amount: string | number): string => {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  return sanitizeInput(amountStr, 'amount');
};

/**
 * Generates CSP header string from configuration
 */
export const generateCSPHeader = (): string => {
  return Object.entries(SECURITY_CONFIG.CSP)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Clears rate limit data (useful for testing or admin functions)
 */
export const clearRateLimits = (): void => {
  rateLimitStore.clear();
};
