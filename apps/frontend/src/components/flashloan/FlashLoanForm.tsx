import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { flashLoanService } from '../../services/flashLoanService';
import { FlashLoanQuote } from './FlashLoanQuote';
import { toast } from 'react-hot-toast';

interface AssetInput {
  id: string;
  asset: string;
  amount: string;
}

const SUPPORTED_ASSETS = [
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether' },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin' },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD' },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin' },
];

export const FlashLoanForm: React.FC = () => {
  const address = useWalletStore((state) => state.address);
  const [assets, setAssets] = useState<AssetInput[]>([{ id: Date.now().toString(), asset: '', amount: '' }]);
  const [receiverAddress, setReceiverAddress] = useState('');
  const [params, setParams] = useState('0x');
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);

  // Set default receiver to wallet address
  useEffect(() => {
    if (address) {
      setReceiverAddress(address);
    }
  }, [address]);

  const addAsset = () => {
    setAssets([...assets, { id: Date.now().toString(), asset: '', amount: '' }]);
  };

  const removeAsset = (id: string) => {
    if (assets.length > 1) {
      setAssets(assets.filter(asset => asset.id !== id));
    }
  };

  const updateAsset = (id: string, field: 'asset' | 'amount', value: string) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, [field]: value } : asset
    ));
  };

  const getQuote = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (assets.some(a => !a.asset || !a.amount)) {
      toast.error('Please fill all asset fields');
      return;
    }

    setIsLoading(true);
    try {
      const assetAddresses = assets.map(a => a.asset);
      const amounts = assets.map(a => a.amount);

      // Check eligibility first
      const eligibilityResult = await flashLoanService.checkEligibility(
        address,
        assetAddresses,
        amounts
      );
      setEligibility(eligibilityResult);

      if (!eligibilityResult.eligible) {
        toast.error(`Not eligible: ${eligibilityResult.reason}`);
        setIsLoading(false);
        return;
      }

      // Get quote
      const quoteResult = await flashLoanService.getFlashLoanQuote(
        address,
        assetAddresses,
        amounts
      );
      setQuote(quoteResult);
      toast.success('Quote generated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to get quote');
      console.error('Error getting quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeFlashLoan = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!receiverAddress) {
      toast.error('Please enter receiver address');
      return;
    }

    if (!quote) {
      toast.error('Please get a quote first');
      return;
    }

    setIsExecuting(true);
    try {
      const assetAddresses = assets.map(a => a.asset);
      const amounts = assets.map(a => a.amount);

      const result = await flashLoanService.executeFlashLoan(
        address,
        receiverAddress,
        assetAddresses,
        amounts,
        params
      );

      if (result.success) {
        toast.success('Flash loan executed successfully!');
        // Reset form
        setAssets([{ id: Date.now().toString(), asset: '', amount: '' }]);
        setQuote(null);
        setEligibility(null);
      } else {
        toast.error('Flash loan execution failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to execute flash loan');
      console.error('Error executing flash loan:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">Request Flash Loan</h2>
      
      {/* Receiver Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Receiver Contract Address
        </label>
        <input
          type="text"
          value={receiverAddress}
          onChange={(e) => setReceiverAddress(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="0x..."
        />
        <p className="mt-2 text-sm text-gray-400">
          The contract that will receive and use the flash loan funds
        </p>
      </div>

      {/* Assets */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-300">
            Assets to Borrow
          </label>
          <button
            type="button"
            onClick={addAsset}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            + Add Asset
          </button>
        </div>

        {assets.map((asset) => (
          <div key={asset.id} className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-7">
              <select
                value={asset.asset}
                onChange={(e) => updateAsset(asset.id, 'asset', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Asset</option>
                {SUPPORTED_ASSETS.map((sa) => (
                  <option key={sa.address} value={sa.address}>
                    {sa.symbol} - {sa.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-4">
              <input
                type="text"
                value={asset.amount}
                onChange={(e) => updateAsset(asset.id, 'amount', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Amount"
              />
            </div>
            <div className="col-span-1 flex items-center">
              {assets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAsset(asset.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Parameters */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Parameters (Optional)
        </label>
        <input
          type="text"
          value={params}
          onChange={(e) => setParams(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="0x..."
        />
        <p className="mt-2 text-sm text-gray-400">
          Additional parameters for the flash loan receiver contract
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={getQuote}
          disabled={isLoading || isExecuting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting Quote...
            </span>
          ) : (
            'Get Quote'
          )}
        </button>

        <button
          type="button"
          onClick={executeFlashLoan}
          disabled={!quote || isExecuting || isLoading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition"
        >
          {isExecuting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Executing...
            </span>
          ) : (
            'Execute Flash Loan'
          )}
        </button>
      </div>

      {/* Eligibility Check */}
      {eligibility && (
        <div className={`mt-6 p-4 rounded-lg ${eligibility.eligible ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
          <div className="flex items-center">
            {eligibility.eligible ? (
              <svg className="h-5 w-5 text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`font-medium ${eligibility.eligible ? 'text-green-300' : 'text-red-300'}`}>
              {eligibility.eligible ? 'Eligible for Flash Loan' : `Not Eligible: ${eligibility.reason}`}
            </span>
          </div>
          {eligibility.trustScore && (
            <div className="mt-2 text-sm text-gray-300">
              Trust Score: {eligibility.trustScore} | Risk Level: {eligibility.riskLevel}
            </div>
          )}
        </div>
      )}

      {/* Quote Display */}
      {quote && (
        <div className="mt-6">
          <FlashLoanQuote quote={quote} />
        </div>
      )}

      {/* Educational Info */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <h3 className="font-medium text-blue-300 mb-2">Beginner Tips</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Flash loans must be repaid in the same transaction</li>
          <li>• You only pay fees if the transaction succeeds</li>
          <li>• Start with small amounts to understand the process</li>
          <li>• Make sure your receiver contract handles the funds correctly</li>
        </ul>
      </div>
    </div>
  );
};
