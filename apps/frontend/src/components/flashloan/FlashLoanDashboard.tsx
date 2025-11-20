import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { FlashLoanForm } from './FlashLoanForm';
import { FlashLoanHistory } from './FlashLoanHistory';
import { RiskAssessment } from './RiskAssessment';
import { UserStats } from './UserStats';
import { LiquidityPool } from './LiquidityPool';

const FlashLoanDashboard: React.FC = () => {
  const address = useWalletStore((state) => state.address);
  const [activeTab, setActiveTab] = useState<'request' | 'history' | 'stats' | 'pool'>('request');

  // Load user data when wallet changes
  useEffect(() => {
    if (address) {
      // Data will be loaded by individual components
    }
  }, [address]);

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
