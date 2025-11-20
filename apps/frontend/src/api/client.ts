import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429;
  },
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ApiClient {
  private client: AxiosInstance;
  private requestCount = 0;
  private readonly REQUEST_TIMEOUT = 30000;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: this.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        this.requestCount++;
        this.logRequest(config);
        return config;
      },
      (error) => {
        this.requestCount--;
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.requestCount--;
        this.logResponse(response);
        return response;
      },
      async (error: AxiosError) => {
        this.requestCount--;
        return this.handleError(error);
      }
    );
  }

  private logRequest(config: InternalAxiosRequestConfig) {
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
  }

  private logResponse(response: any) {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
  }

  private async handleError(error: AxiosError): Promise<never> {
    if (import.meta.env.DEV) {
      console.error('[API Error]', error);
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          toast.error(data.message || 'Invalid request');
          break;
        case 401:
          toast.error('Authentication required');
          break;
        case 403:
          toast.error('Access forbidden');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
        case 502:
        case 503:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data.message || 'An unexpected error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }

    throw error;
  }

  async request<T = any>(
    config: {
      url: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      data?: any;
      params?: any;
      headers?: any;
    },
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const finalRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    let lastError: AxiosError | null = null;

    for (let attempt = 0; attempt <= finalRetryConfig.retries; attempt++) {
      try {
        const response = await this.client.request<T>({
          ...config,
          headers: {
            ...this.client.defaults.headers,
            ...config.headers,
          },
        });
        return response.data;
      } catch (error) {
        lastError = error as AxiosError;

        if (attempt < finalRetryConfig.retries) {
          const shouldRetry = finalRetryConfig.retryCondition
            ? finalRetryConfig.retryCondition(lastError)
            : true;

          if (shouldRetry) {
            const delay = finalRetryConfig.retryDelay * Math.pow(2, attempt);
            await sleep(delay);
            continue;
          }
        }

        break;
      }
    }

    throw lastError;
  }

  get<T = any>(url: string, config?: { params?: any; headers?: any }) {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  post<T = any>(url: string, data?: any, config?: { headers?: any }) {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  put<T = any>(url: string, data?: any, config?: { headers?: any }) {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  patch<T = any>(url: string, data?: any, config?: { headers?: any }) {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  delete<T = any>(url: string, config?: { headers?: any }) {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  getRequestCount() {
    return this.requestCount;
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.client.defaults.headers.Authorization;
  }
}

export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || 'https://api.coingecko.com/api/v3'
);

export const blockchainApiClient = new ApiClient(
  import.meta.env.VITE_BLOCKCHAIN_API_BASE_URL || ''
);

