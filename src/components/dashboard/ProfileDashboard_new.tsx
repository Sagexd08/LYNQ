import React, { useEffect, useState } from "react";
import TrustScoreCard from "./TrustScoreCard";

// Type definitions
interface NFT {
  name: string;
  image: string;
}

interface Transaction {
  type: string;
  version: string;
  timestamp: string;
  hash?: string;
}

const ProfileDashboard: React.FC = () => {
  // For now, we'll use a placeholder wallet address
  // In a real implementation, you'd get this from your Web3 wallet provider
  const walletAddress: string | undefined = undefined;

  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [stakingTab, setStakingTab] = useState<boolean>(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Placeholder for Web3 wallet integration
    // In a real implementation, you'd fetch data from Ethereum/EVM networks
    if (!walletAddress) {
      setTrustScore(0);
      return;
    }

    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Placeholder trust score calculation
        setTrustScore(75);
        
        // Placeholder NFTs and transactions
        setNfts([
          { name: "Sample NFT", image: "/placeholder-nft.png" }
        ]);
        
        setTransactions([
          { 
            type: "Transfer", 
            version: "1", 
            timestamp: new Date().toISOString(),
            hash: "0x1234...5678"
          }
        ]);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch wallet data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust Score */}
      <TrustScoreCard score={trustScore || 0} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-white/60">Portfolio Value</div>
          <div className="text-xl font-bold text-white">$0.00</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-white/60">Active Loans</div>
          <div className="text-xl font-bold text-cyan-400">0</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-white/60">NFT Collection</div>
          <div className="text-xl font-bold text-purple-400">{nfts.length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-white/60">Transactions</div>
          <div className="text-xl font-bold text-green-400">{transactions.length}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NFT Collection */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">NFT Collection</h3>
          {nfts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {nfts.slice(0, 4).map((nft, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                >
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-white/60 text-xs">NFT</span>
                  </div>
                  <div className="text-xs text-white/80 truncate">{nft.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <div className="text-4xl mb-2">🖼️</div>
              <div>No NFTs found</div>
              <div className="text-sm mt-1">Connect your wallet to view your collection</div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{tx.type}</div>
                    <div className="text-xs text-white/60">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs text-cyan-400 font-mono">
                    {tx.hash?.slice(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <div className="text-4xl mb-2">📋</div>
              <div>No recent activity</div>
              <div className="text-sm mt-1">
                Welcome to your Web3 dashboard.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom tabs */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-1 flex">
        <button
          onClick={() => setStakingTab(false)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            !stakingTab
              ? "bg-cyan-500 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          Portfolio Overview
        </button>
        <button
          onClick={() => setStakingTab(true)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            stakingTab
              ? "bg-cyan-500 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          Staking & Rewards
        </button>
      </div>

      {stakingTab && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Staking & Rewards</h3>
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">🎯</div>
            <div>Staking coming soon</div>
            <div className="text-sm mt-1">Earn rewards by staking your tokens</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDashboard;
