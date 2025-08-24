// src/components/dashboard/BalanceOverview.tsx

interface BalanceOverviewProps {
  ethBalance?: number;
}

const BalanceOverview: React.FC<BalanceOverviewProps> = ({ ethBalance }) => {
  // Mock portfolio data
  const portfolioData = {
    totalValue: ethBalance ? ethBalance * 2500 + 1250 : 0,
    apt: {
      amount: ethBalance || 0,
      value: ethBalance ? ethBalance * 2500 : 0,
      change24h: 5.2
    },
    nfts: {
      count: ethBalance ? 3 : 0,
      value: ethBalance ? 850 : 0
    },
    staked: {
      amount: ethBalance ? ethBalance * 0.3 : 0,
      value: ethBalance ? ethBalance * 0.3 * 2500 : 0,
      apy: 12.4
    }
  };

  return (
    <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-cyan-500/10 transition-all hover:shadow-cyan-500/20 text-white space-y-6">
      
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
        Balance Overview
      </h3>

      {/* Total Portfolio Value */}
      <div className="text-center p-4 bg-white/5 border border-white/10 rounded-xl shadow-inner shadow-cyan-500/10">
        <div className="text-sm text-white/70 mb-1">Total Portfolio Value</div>
        <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          ${portfolioData.totalValue.toFixed(2)}
        </div>
        <div className="text-sm text-green-400 flex items-center justify-center gap-1">
          <span>↗</span> +2.8% today
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-4 text-sm">
        {/* APT */}
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center font-bold text-sm text-white">
              A
            </div>
            <div>
              <div className="font-medium text-white">Ethereum (ETH)</div>
              <div className="text-white/70">{portfolioData.apt.amount.toFixed(4)} APT</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium text-white">${portfolioData.apt.value.toFixed(2)}</div>
            <div className="text-green-400">+{portfolioData.apt.change24h}%</div>
          </div>
        </div>

        {/* NFTs */}
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm text-white">
              N
            </div>
            <div>
              <div className="font-medium text-white">NFTs</div>
              <div className="text-white/70">{portfolioData.nfts.count} items</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium text-white">${portfolioData.nfts.value.toFixed(2)}</div>
            <div className="text-white/60">Est. value</div>
          </div>
        </div>

        {/* Staked */}
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center font-bold text-sm text-white">
              S
            </div>
            <div>
              <div className="font-medium text-white">Staked APT</div>
              <div className="text-white/70">{portfolioData.staked.amount.toFixed(4)} APT</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium text-white">${portfolioData.staked.value.toFixed(2)}</div>
            <div className="text-green-400">{portfolioData.staked.apy}% APY</div>
          </div>
        </div>
      </div>

      {/* Collateral Info */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="text-sm font-medium text-green-400 mb-1">
          💎 Available for Collateral
        </div>
        <div className="text-lg font-bold text-white">
          ${(portfolioData.totalValue * 0.8).toFixed(2)}
        </div>
        <div className="text-xs text-white/70">
          80% of portfolio value (standard LTV ratio)
        </div>
      </div>
    </div>
  );
};

export default BalanceOverview;
