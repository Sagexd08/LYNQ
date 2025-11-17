import React, { useState, useEffect } from 'react';
import { flashLoanService } from '../../services/flashLoanService';
import { toast } from 'react-hot-toast';

export const LiquidityPool: React.FC = () => {
  const [liquidityData, setLiquidityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLiquidityData();
  }, []);

  const loadLiquidityData = async () => {
    setIsLoading(true);
    try {
      const data = await flashLoanService.getAvailableLiquidity();
      setLiquidityData(data);
    } catch (error) {
      toast.error('Failed to load liquidity data');
      console.error('Error loading liquidity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: string) => {
    try {
      const num = parseFloat(amount);
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}K`;
      }
      return num.toFixed(2);
    } catch {
      return amount;
    }
  };

  const getAssetSymbol = (address: string) => {
    const assetMap: Record<string, string> = {
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
      '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
    };
    return assetMap[address] || address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Liquidity Pool</h3>
        <div className="flex justify-center items-center h-32">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!liquidityData) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Liquidity Pool</h3>
          <button
            onClick={loadLiquidityData}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Refresh
          </button>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>Unable to load liquidity data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Liquidity Pool</h3>
        <button
          onClick={loadLiquidityData}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Refresh
        </button>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total Assets</div>
          <div className="text-2xl font-bold text-white">{liquidityData.assets.length}</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total Value</div>
          <div className="text-2xl font-bold text-white">
            {liquidityData.assets.reduce((sum: number, asset: any) => sum + parseFloat(asset.liquidity), 0).toLocaleString(undefined, {
              maximumFractionDigits: 2
            })} ETH
          </div>
        </div>
      </div>

      {/* Assets List */}
      <div className="mb-6">
        <h4 className="font-medium text-white mb-3">Available Assets</h4>
        <div className="space-y-3">
          {liquidityData.assets.map((asset: any, index: number) => (
            <div key={index} className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="bg-gray-700 rounded-full p-2 mr-3">
                    <svg className="h-6 w-6 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">{getAssetSymbol(asset.address)}</div>
                    <div className="text-xs text-gray-400 font-mono">{asset.address.substring(0, 8)}...{asset.address.substring(asset.address.length - 6)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">{formatAmount(asset.liquidity)}</div>
                  <div className="text-xs text-gray-400">Available</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Utilization</span>
                  <span className="text-gray-400">
                    {Math.min(100, (parseFloat(asset.liquidity) / parseFloat(asset.maxAmount) * 100)).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full bg-indigo-500"
                    style={{ 
                      width: `${Math.min(100, (parseFloat(asset.liquidity) / parseFloat(asset.maxAmount) * 100))}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Max Amount */}
              <div className="mt-2 text-xs text-gray-400">
                Max flash loan: {formatAmount(asset.maxAmount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Info */}
      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <h4 className="font-medium text-blue-300 mb-2">About Liquidity</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Liquidity represents funds available for flash loans</li>
          <li>• Higher liquidity means larger flash loans are possible</li>
          <li>• Utilization shows how much of the pool is currently in use</li>
          <li>• Max flash loan is the largest single loan possible</li>
        </ul>
      </div>
    </div>
  );
};
