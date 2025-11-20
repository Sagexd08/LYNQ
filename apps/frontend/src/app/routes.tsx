import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage, MarketplacePage, DashboardPage, LoansPage, FlashLoanPage } from './lazyPages';
import HealthIndicator from '../components/HealthIndicator';
import { useWalletStore } from '../store/walletStore';

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const address = useWalletStore((state) => state.address);
  
  if (!address) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function AppRoutes() {
  // State removed as it was unused or handled internally by pages

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route 
            path="/" 
            element={<LandingPage />} 
          />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/loans" 
            element={
              <ProtectedRoute>
                <LoansPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/flashloan" 
            element={
              <ProtectedRoute>
                <FlashLoanPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <HealthIndicator />
    </BrowserRouter>
  );
}

