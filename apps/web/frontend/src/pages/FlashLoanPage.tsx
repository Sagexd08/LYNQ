import React, { Suspense, lazy } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingFallback } from '../components/Loading';

const LazyFlashLoanDashboard = lazy(() => import("../components/flashloan/FlashLoanDashboard"));

const FlashLoanPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback minHeight="400px" />}>
            <LazyFlashLoanDashboard />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default FlashLoanPage;
