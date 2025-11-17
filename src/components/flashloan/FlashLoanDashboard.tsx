import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { flashLoanService } from '../../services/flashLoanService';
import { FlashLoanForm } from './FlashLoanForm';
import { FlashLoanQuote } from './FlashLoanQuote';
import { FlashLoanHistory } from './FlashLoanHistory';
import { RiskAssessment } from './RiskAssessment';
import { UserStats } from './UserStats';
import { LiquidityPool } from './LiquidityPool';
import { TransactionSimulator } from './TransactionSimulator';

const FlashLoanDashboard: React.FC = () => {
  const { address: walletAddress } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'request' | 'history' | 'stats' | 'pool'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data when wallet changes
  useEffect(() => {
    if (walletAddress) {
      // Data will be loaded by individual components
    }
  }, [walletAddress]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Flash Loan Platform</h1>
        <p className="text-gray-400">
          Execute flash loans with beginner-friendly tools, risk assessment, and step-by-step guidance
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('request')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'request'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Request Flash Loan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Transaction History
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            My Statistics
          </button>
          <button
            onClick={() => setActiveTab('pool')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pool'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Liquidity Pool
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-300">Error</h3>
              <div className="mt-2 text-sm text-red-200">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        {activeTab === 'request' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <FlashLoanForm />
              </div>
              <div className="space-y-6">
                <RiskAssessment />
                <TransactionSimulator />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <FlashLoanHistory />
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <UserStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RiskAssessment />
              <LiquidityPool />
            </div>
          </div>
        )}

        {activeTab === 'pool' && (
          <LiquidityPool />
        )}
      </div>
    </div>
  );
};

export default FlashLoanDashboard;
