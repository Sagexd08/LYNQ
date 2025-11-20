import React, { Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingFallback } from '../components/Loading';
import { useWalletStore } from '../store/walletStore';
import {
  LazyProfileDashboard,
  LazyPersonalDetails,
  LazyTransaction,
} from '../lazyComponents';

const Dashboard: React.FC = () => {
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const walletType = useWalletStore((state) => state.walletType);
  const isLoadingBalance = useWalletStore((state) => state.isLoadingBalance);
  const balanceError = useWalletStore((state) => state.balanceError);

  const walletData = {
    address,
    balance,
    walletType,
    isLoadingBalance,
    balanceError,
  };
  return (
    <div className="min-h-screen w-full text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white/5 border border-white/10 rounded-lg p-6 shadow-lg mt-20">
          <div className="lg:col-span-2 space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback minHeight="300px" />}>
                <LazyProfileDashboard 
                  ethBalance={balance}
                />
              </Suspense>
            </ErrorBoundary>
            <Suspense fallback={<LoadingFallback minHeight="200px" />}>
              <LazyPersonalDetails {...walletData} />
            </Suspense>
          </div>
          {/* Transaction History */}
          <Suspense fallback={<LoadingFallback minHeight="200px" />}>
            <LazyTransaction />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
