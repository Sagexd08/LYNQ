import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { flashLoanService } from '../../services/flashLoanService';
import { toast } from 'react-hot-toast';

export const UserStats: React.FC = () => {
  const { walletAddress } = useWalletStore();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadUserStats();
    }
  }, [walletAddress]);

  const loadUserStats = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const data = await flashLoanService.getUserStats(walletAddress);
      setStats(data);
    } catch (error) {
      toast.error('Failed to load user statistics');
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Your Statistics</h3>
        <div className="flex justify-center items-center h-32">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Your Statistics</h3>
          <button
            onClick={loadUserStats}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Refresh
          </button>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>Connect your wallet to view statistics</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-orange-400';
      case 'Critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Your Statistics</h3>
        <button
          onClick={loadUserStats}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Flash Loans */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total Flash Loans</div>
          <div className="text-2xl font-bold text-white">{stats.totalFlashLoans}</div>
        </div>

        {/* Success Rate */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-white">{stats.successRate}%</div>
        </div>

        {/* Successful Loans */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Successful</div>
          <div className="text-2xl font-bold text-green-400">{stats.successfulFlashLoans}</div>
        </div>

        {/* Failed Loans */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-400">{stats.failedFlashLoans}</div>
        </div>
      </div>

      {/* Risk Level */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Risk Level</span>
          <span className={`font-medium ${getRiskColor(stats.riskLevel)}`}>
            {stats.riskLevel}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              stats.riskLevel === 'Low' ? 'bg-green-500' :
              stats.riskLevel === 'Medium' ? 'bg-yellow-500' :
              stats.riskLevel === 'High' ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ 
              width: stats.riskLevel === 'Low' ? '25%' :
                     stats.riskLevel === 'Medium' ? '50%' :
                     stats.riskLevel === 'High' ? '75%' : '100%' 
            }}
          ></div>
        </div>
      </div>

      {/* Trust Score */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Trust Score</span>
          <span className="text-white font-medium">{stats.trustScore}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-blue-500"
            style={{ width: `${Math.min(100, stats.trustScore / 10)}%` }}
          ></div>
        </div>
      </div>

      {/* Total Volume */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Volume Flash Loaned</span>
          <span className="text-white font-medium">
            {parseFloat(stats.totalVolumeFlashLoaned).toLocaleString(undefined, {
              maximumFractionDigits: 2
            })} ETH
          </span>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="pt-4 border-t border-gray-700">
        <h4 className="font-medium text-white mb-3">Performance Overview</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-green-400">{stats.successRate}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${stats.successRate}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Experience Level</span>
              <span className="text-blue-400">
                {stats.totalFlashLoans === 0 ? 'Newbie' :
                 stats.totalFlashLoans < 5 ? 'Beginner' :
                 stats.totalFlashLoans < 20 ? 'Intermediate' : 'Expert'}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-500"
                style={{ 
                  width: stats.totalFlashLoans === 0 ? '10%' :
                         stats.totalFlashLoans < 5 ? '30%' :
                         stats.totalFlashLoans < 20 ? '60%' : '100%' 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-700 rounded-lg">
        <h4 className="font-medium text-indigo-300 mb-2">Performance Tips</h4>
        <ul className="text-sm text-indigo-200 space-y-1">
          {stats.successRate < 80 ? (
            <li>• Focus on improving your success rate by testing strategies first</li>
          ) : (
            <li>• Great job! Your success rate is excellent</li>
          )}
          {stats.totalFlashLoans < 5 && (
            <li>• Start with smaller amounts to build experience</li>
          )}
          {stats.trustScore < 700 && (
            <li>• Improve your trust score by completing successful loans</li>
          )}
        </ul>
      </div>
    </div>
  );
};
