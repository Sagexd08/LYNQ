import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HealthCheck: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [dbStatus, setDbStatus] = useState<string>('unknown');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Assuming the backend is proxied or configured to be at /api/v1
        // Adjust the URL if necessary based on environment config
        const response = await axios.get('/api/v1/health');
        if (response.data.status === 'ok') {
          setStatus('ok');
          setDbStatus(response.data.database);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setStatus('error');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV === 'production') return null; // Hide in prod if desired, or keep it.

  return (
    <div className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-75 hover:opacity-100 transition-opacity z-50">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'ok' ? 'bg-green-500' : status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'}`} />
        <span>API: {status.toUpperCase()}</span>
      </div>
      {status === 'ok' && (
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${dbStatus === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>DB: {dbStatus.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
};

export default HealthCheck;
