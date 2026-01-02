import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';
export const getApiBaseUrl = (): string => {
  const envValue = (import.meta as any)?.env?.VITE_API_BASE_URL;
  return envValue || 'http:
};
const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
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
