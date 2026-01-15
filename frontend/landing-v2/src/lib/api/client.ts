import axios, { AxiosInstance, AxiosError } from 'axios';
// import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const token = localStorage.getItem('lynq_access_token');
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('lynq_access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          // const data = error.response.data as any;

          switch (status) {
            case 401:
              localStorage.removeItem('lynq_access_token');
              localStorage.removeItem('lynq_profile');
              // toast.error('Session expired. Please login again.');
              break;
            case 403:
              // toast.error('You do not have permission to perform this action.');
              break;
            case 404:
              // toast.error('Resource not found.');
              break;
            case 422:
              // const message = data?.message || data?.error || 'Validation error';
              // toast.error(Array.isArray(message) ? message.join(', ') : message);
              break;
            case 500:
              // toast.error('Server error. Please try again later.');
              break;
            default:
            // toast.error(data?.message || 'An error occurred');
          }
        } else if (error.request) {
          // toast.error('Network error. Please check your connection.');
          console.warn('Network error:', error.request);
        } else {
          // toast.error('An unexpected error occurred');
          console.warn('Unexpected error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }

  setAuthToken(token: string | null) {
    if (token) {
      localStorage.setItem('lynq_access_token', token);
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('lynq_access_token');
      delete this.client.defaults.headers.common['Authorization'];
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient.instance;
