import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { flashLoanService } from '../../services/flashLoanService';
import { toast } from 'react-hot-toast';

export const FlashLoanHistory: React.FC = () => {
  const { walletAddress } = useWalletStore();
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    if (walletAddress) {
      loadHistory();
    }
  }, [walletAddress, page]);

  const loadHistory = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const data = await flashLoanService.getFlashLoanHistory(
        walletAddress,
        pageSize,
        (page - 1) * pageSize
      );
      setHistory(data);
    } catch (error) {
      toast.error('Failed to load transaction history');
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: string) => {
    try {
      return parseFloat(amount).toFixed(4);
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
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 max-w-md mx-auto">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-white">No Transaction History</h3>
          <p className="mt-2 text-gray-400">
            You haven't executed any flash loans yet. Start by requesting your first flash loan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Transaction History</h3>
        <p className="text-gray-400">
          View your flash loan transaction history and details
        </p>
      </div>

      {history.transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-white">No Transactions Found</h3>
            <p className="mt-2 text-gray-400">
              No flash loan transactions found for this page.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Assets
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Fees
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                  {history.transactions.map((transaction: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white font-mono">
                              {transaction.transactionHash.substring(0, 8)}...{transaction.transactionHash.substring(transaction.transactionHash.length - 6)}
                            </div>
                            <div className="text-xs text-gray-400">
                              View on Explorer
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {transaction.assets.map((asset: string, i: number) => (
                            <div key={i} className="flex items-center">
                              <span>{getAssetSymbol(asset)}</span>
                              {i < transaction.assets.length - 1 && <span className="mx-1 text-gray-500">+</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {transaction.amounts.map((amount: string, i: number) => (
                            <div key={i}>
                              {formatAmount(amount)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {transaction.premiums.map((premium: string, i: number) => (
                            <div key={i} className="text-green-400">
                              {formatAmount(premium)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.success 
                            ? 'bg-green-900/30 text-green-300' 
                            : 'bg-red-900/30 text-red-300'
                        }`}>
                          {transaction.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(transaction.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, history.total)} of {history.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`px-4 py-2 text-sm rounded-lg ${
                  page === 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= history.total}
                className={`px-4 py-2 text-sm rounded-lg ${
                  page * pageSize >= history.total
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Educational Info */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <h4 className="font-medium text-blue-300 mb-2">Understanding Your History</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Successful transactions show funds were repaid correctly</li>
          <li>• Failed transactions were reverted and no fees were charged</li>
          <li>• Fees are only charged for successful flash loans</li>
          <li>• Gas costs are not included in the fee calculation</li>
        </ul>
      </div>
    </div>
  );
};
