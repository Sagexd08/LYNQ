

import React, { useEffect, useState } from "react";
import TrustScoreCard from "./TrustScoreCard";

// For now, we'll remove the Aptos wallet adapter dependencies
// and use a placeholder for wallet connection
// In a real implementation, you'd use a Web3 library like ethers.js

const PLACEHOLDER_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

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

interface TokenData {
  metadata?: {
    name?: string;
    uri?: string;
  };
}

interface IndexerResource {
  type: string;
  data?: {
    token_data?: TokenData;
  };
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
    if (!walletAddress) {
      setTrustScore(0);
      return;
    }

    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Fetch TrustScore with better error handling
        try {
          const res = await aptos.getAccountResource(
            walletAddress,
            "0xaf1472b72a6d6fc5ace1313c8856ab71174fcc2a846de8fd7d10ab3e32510c94::trust_score::TrustScore"
          ) as any;
          setTrustScore(res?.data?.score || 0);
        } catch (err) {
          console.warn("TrustScore not found, setting to 0");
          setTrustScore(0);
        }

        // Fetch NFTs with better error handling
        try {
          const response = await fetch(
            `${INDEXER_URL}/accounts/${walletAddress}/resources`,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data: IndexerResource[] = await response.json();

          if (Array.isArray(data)) {
            const tokenResources = data.filter((resource: IndexerResource) =>
              resource.type && resource.type.startsWith("0x3::token::Token")
            );

            const extractedNFTs: NFT[] = tokenResources.map((res: IndexerResource) => {
              const { name, uri } = res.data?.token_data?.metadata || {};
              return {
                name: name || "Unnamed NFT",
                image: uri || "https://via.placeholder.com/300x300?text=No+Image",
              };
            });

            setNfts(extractedNFTs);
          } else {
            setNfts([]);
          }
        } catch (err) {
          console.warn("Failed to fetch NFTs:", err);
          setNfts([]);
        }

        // Mock transactions for now
        setTransactions([]);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">⚠️</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          👤 Profile Dashboard
        </h1>
        <p className="text-gray-300">
          Welcome to your Web3 dashboard, powered by Aptos.
        </p>
        {walletAddress && (
          <p className="text-sm text-gray-400 mt-2">
            Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        )}
      </div>

      {!stakingTab && trustScore !== null && (
        <div className="mb-8">
          <TrustScoreCard score={trustScore} />
        </div>
      )}

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setStakingTab(false)}
          className={`px-5 py-2.5 rounded-lg font-medium transition ${
            !stakingTab
              ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg"
              : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
          }`}
          type="button"
        >
          🧾 View Transactions
        </button>
        <button
          onClick={() => setStakingTab(true)}
          className={`px-5 py-2.5 rounded-lg font-medium transition ${
            stakingTab
              ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg"
              : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
          }`}
          type="button"
        >
          🖼️ View NFTs
        </button>
      </div>

      {stakingTab ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {nfts && nfts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎨</div>
              <p className="text-gray-400">No NFTs found in your wallet.</p>
              {!walletAddress && (
                <p className="text-sm text-gray-500 mt-2">Connect your wallet to view NFTs</p>
              )}
            </div>
          ) : (
            nfts.map((nft: NFT, i: number) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md shadow hover:shadow-cyan-500/20 transition"
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x300?text=No+Image";
                  }}
                />
                <div className="p-4">
                  <p className="font-semibold text-white truncate">
                    {nft.name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {transactions && transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <p className="text-gray-400">No recent transactions found.</p>
              {!walletAddress && (
                <p className="text-sm text-gray-500 mt-2">Connect your wallet to view transaction history</p>
              )}
            </div>
          ) : (
            transactions.map((tx: Transaction, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/10 shadow transition hover:shadow-indigo-500/20"
              >
                <div className="font-semibold">{tx.type}</div>
                <div className="text-sm text-gray-400">{tx.timestamp}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDashboard;
