import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      // Handle specific error codes
      if (status === 401) {
        localStorage.removeItem('authToken');
        toast.error('Session expired. Please reconnect your wallet.');
      } else if (status === 403) {
        toast.error('Access denied');
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (data?.message) {
        toast.error(data.message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
