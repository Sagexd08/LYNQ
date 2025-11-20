import { useState, useEffect } from 'react';
import apiClient from '../services/api/client';

export interface HealthStatus {
  status: 'ok' | 'error' | 'loading';
  timestamp?: string;
  database?: 'ok' | 'error';
  message?: string;
}

export function useHealthCheck(intervalMs: number = 30000) {
  const [health, setHealth] = useState<HealthStatus>({ status: 'loading' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiClient.get('/health');
        setHealth({
          status: response.data.status === 'ok' ? 'ok' : 'error',
          timestamp: response.data.timestamp,
          database: response.data.database,
        });
      } catch (error) {
        setHealth({
          status: 'error',
          message: 'Failed to connect to backend',
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return health;
}
