import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Wallet, Globe, Activity } from 'lucide-react';

interface PersonalDetailsProps {
  address?: string;
  ethBalance: number;
  walletType?: string;
  connectedAt?: string | null;
  isLoadingBalance?: boolean;
  balanceError?: string | null;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ address, ethBalance, walletType, connectedAt, isLoadingBalance, balanceError }) => {
  const [usdRate, setUsdRate] = useState(2500);
  const [trustScore] = useState(75);
  const [trustTier, setTrustTier] = useState("🥈 Gold");
  const [copied, setCopied] = useState(false);

  const fetchPrice = async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
      const data = await res.json();
      setUsdRate(data.ethereum.usd || 2500);
    } catch (err) {
      console.error("Failed to fetch ETH price:", err);
    }
  };

  useEffect(() => {
    fetchPrice();
    if (trustScore >= 86) setTrustTier("🥇 Elite");
    else if (trustScore >= 61) setTrustTier("🥈 Gold");
    else if (trustScore >= 31) setTrustTier("🥉 Silver");
    else setTrustTier("🔸 Beginner");
  }, [address, trustScore]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const network = address?.startsWith('0x') ? 'Ethereum Mainnet' : 'Unknown';

  return (
    <motion.div
      className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/20 group hover:border-electric-blue/30 transition-all duration-300"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-electric-blue/20 rounded-lg text-electric-blue">
            <Wallet className="w-5 h-5" />
          </span>
          Wallet Details
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${address ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {address ? '● Connected' : '○ Disconnected'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address Section */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/50 font-bold">Address</label>
          <div
            onClick={handleCopy}
            className="group/addr cursor-pointer p-4 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between hover:bg-black/40 hover:border-neon-cyan/30 transition-colors"
          >
            <span className="font-mono text-sm text-white/90 truncate mr-2">
              {address || 'Not connected'}
            </span>
            <span className="text-neon-cyan">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 opacity-50 group-hover/addr:opacity-100" />}
            </span>
          </div>
        </div>

        {/* Balance Section */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/50 font-bold flex justify-between">
            <span>Holdings</span>
            <button onClick={fetchPrice} className="text-electric-blue hover:text-white transition-colors text-[10px]">REFRESH</button>
          </label>
          <div className="p-4 bg-gradient-to-r from-electric-blue/10 to-transparent border border-electric-blue/20 rounded-xl">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-white">
                {isLoadingBalance ? '...' : (ethBalance || 0).toFixed(4)}
              </span>
              <span className="text-sm text-electric-blue font-bold">ETH</span>
            </div>
            <div className="text-xs text-white/50 font-mono mt-1">
              ≈ ${(ethBalance * usdRate).toFixed(2)} USD
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/50 font-bold">Network</label>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="p-2 bg-purple-500/20 rounded-full text-purple-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{network}</div>
              <div className="text-xs text-white/50">{walletType || 'Web3 Wallet'}</div>
            </div>
          </div>
        </div>

        {/* Trust Score Mini */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/50 font-bold">Reputation</label>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 bg-gradient-to-r from-transparent to-yellow-500/5">
            <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{trustTier}</div>
              <div className="text-xs text-white/50">Score: {trustScore}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalDetails;