import { useHealthCheck } from '../hooks/useHealthCheck';

export default function HealthIndicator() {
  const health = useHealthCheck(60000); // Check every 60s

  if (health.status === 'loading') {
    return null; // Don't show during initial load
  }

  if (health.status === 'ok') {
    return null; // Don't show when healthy
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
      <svg 
        className="w-5 h-5" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-sm font-medium">
        {health.message || 'Backend service unavailable'}
      </span>
    </div>
  );
}
