import React, { useEffect, useState } from 'react';

interface PersonalDetailsProps {
  address: string;
  aptosBalance: number;
  walletType: string;
  connectedAt: string | null;
  isLoadingBalance: boolean;
  balanceError: string | null;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ address, aptosBalance, walletType, connectedAt, isLoadingBalance, balanceError }) => {
  const [usdRate, setUsdRate] = useState(8.5);
  const [trustScore] = useState(75); // Mock score since useTrustScore hook doesn't exist
  const [trustTier, setTrustTier] = useState("🥈 Gold");

  const fetchPrice = async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd");
      const data = await res.json();
      setUsdRate(data.aptos.usd || 8.5);
    } catch (err) {
      console.error("Failed to fetch APT price:", err);
    }
  };

  useEffect(() => {
    fetchPrice();
    // Set trust tier based on mock score
    if (trustScore >= 86) setTrustTier("🥇 Elite");
    else if (trustScore >= 61) setTrustTier("🥈 Gold");
    else if (trustScore >= 31) setTrustTier("🥉 Silver");
    else setTrustTier("🔸 Beginner");
  }, [address, trustScore]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      console.log('Wallet address copied to clipboard');
    }
  };

  const network = address?.startsWith('0x') ? 'Aptos Testnet' : 'Unknown';

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-purple-400">👤</span> Personal Details
      </h3>

      <div className="space-y-6 text-sm text-white/80">
        {/* Wallet Address */}
        <div>
          <label className="block text-white/60 mb-1">Wallet Address</label>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg font-mono break-all text-white text-sm flex justify-between items-center">
            <span>{address || 'Not connected'}</span>
            {address && (
              <button 
                onClick={handleCopy} 
                className="ml-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Copy
              </button>
            )}
          </div>
        </div>

        {/* Wallet Provider */}
        {walletType && (
          <div>
            <label className="block text-white/60 mb-1">Wallet Provider</label>
            <div className="text-lg font-medium text-cyan-400">{walletType}</div>
          </div>
        )}

        {/* APT Balance & USD */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 mb-1">APT Balance</label>
            <div className="text-lg font-bold text-green-400">
              {isLoadingBalance ? (
                <span className="animate-pulse">Loading...</span>
              ) : balanceError ? (
                <span className="text-red-400">Error</span>
              ) : aptosBalance ? (
                `${aptosBalance.toFixed(4)} APT`
              ) : (
                '--'
              )}
            </div>
          </div>
          <div>
            <label className="flex items-center justify-between text-white/60 mb-1">
              USD Value
              <button
                onClick={fetchPrice}
                className="text-xs px-2 py-0.5 bg-cyan-600 hover:bg-cyan-700 rounded text-white transition-colors"
              >
                🔄 Refresh
              </button>
            </label>
            <div className="text-lg font-bold text-white">
              {isLoadingBalance ? (
                <span className="animate-pulse">Loading...</span>
              ) : aptosBalance ? (
                `$${(aptosBalance * usdRate).toFixed(2)}`
              ) : (
                '--'
              )}
            </div>
          </div>
        </div>

        {/* TrustScore + Tier */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 mb-1">TrustScore</label>
            <div className="text-lg font-bold text-purple-300">{trustScore}</div>
          </div>
          <div>
            <label className="block text-white/60 mb-1">Tier</label>
            <div className="text-lg font-bold text-yellow-300">{trustTier}</div>
          </div>
        </div>

        {/* Account Status */}
        <div>
          <label className="block text-white/60 mb-1">Account Status</label>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-medium">
              {address ? 'Connected & Verified' : 'Not Connected'}
            </span>
          </div>
        </div>

        {/* Connected At */}
        {address && (
          <div>
            <label className="block text-white/60 mb-1">Connected At</label>
            <div className="text-white/80">
              {connectedAt
                ? new Date(connectedAt).toLocaleString()
                : new Date().toLocaleString()}
            </div>
          </div>
        )}

        {/* Network */}
        {address && (
          <div>
            <label className="block text-white/60 mb-1">Network</label>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-green-400 font-medium">{network}</span>
            </div>
          </div>
        )}

        {/* Balance Error Display */}
        {balanceError && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <label className="block text-red-400 mb-1">Balance Error</label>
            <div className="text-red-300 text-xs">{balanceError}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalDetails;