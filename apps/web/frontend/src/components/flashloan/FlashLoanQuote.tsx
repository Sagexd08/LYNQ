import React from 'react';
import { formatUnits } from 'ethers';

interface FlashLoanQuoteProps {
  quote: any;
}

export const FlashLoanQuote: React.FC<FlashLoanQuoteProps> = ({ quote }) => {
  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      return parseFloat(formatUnits(amount, decimals)).toFixed(4);
    } catch {
      return amount;
    }
  };

  const formatGasCost = (gasCost: string) => {
    try {
      return parseFloat(formatUnits(gasCost, 18)).toFixed(6);
    } catch {
      return gasCost;
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Flash Loan Quote</h3>
      
      <div className="space-y-4">
        {/* Risk Level */}
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">Risk Level</span>
          <span className={`font-medium ${
            quote.riskLevel === 'Low' ? 'text-green-400' :
            quote.riskLevel === 'Medium' ? 'text-yellow-400' :
            quote.riskLevel === 'High' ? 'text-orange-400' : 'text-red-400'
          }`}>
            {quote.riskLevel}
          </span>
        </div>

        {/* Fee */}
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">Flash Loan Fee</span>
          <span className="text-white">{(quote.feeBps / 100).toFixed(2)}%</span>
        </div>

        {/* Gas Estimate */}
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">Estimated Gas</span>
          <span className="text-white">{parseInt(quote.estimatedGas).toLocaleString()} units</span>
        </div>

        {/* Gas Cost */}
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">Estimated Gas Cost</span>
          <span className="text-white">{formatGasCost(quote.estimatedGasCost)} ETH</span>
        </div>

        {/* Assets Breakdown */}
        <div className="pt-4">
          <h4 className="font-medium text-white mb-3">Assets Breakdown</h4>
          <div className="space-y-3">
            {quote.assets.map((asset: string, index: number) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Asset</span>
                  <span className="text-white font-mono">{asset.substring(0, 6)}...{asset.substring(asset.length - 4)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400">Amount</div>
                    <div className="text-white">{formatAmount(quote.amounts[index])}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Fee</div>
                    <div className="text-white">{formatAmount(quote.premiums[index])}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Total</div>
                    <div className="text-white">{formatAmount(quote.totalCosts[index])}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Fees</span>
            <span className="text-white font-bold">
              {quote.premiums.reduce((sum: number, premium: string) => sum + parseFloat(formatUnits(premium, 18)), 0).toFixed(6)} ETH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
