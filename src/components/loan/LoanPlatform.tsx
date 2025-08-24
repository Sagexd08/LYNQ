import React, { useState } from "react";
import LoanDashboard from "../card/LoanDashboard";

const LoanPlatform: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Check if wallet is available
  React.useEffect(() => {
    const checkWallet = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setIsConnected(accounts.length > 0);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkWallet();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Elegant DeFi
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Loan Platform
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Decentralized lending powered by trust-based scoring on the Ethereum blockchain. 
              Get instant loans with competitive rates and flexible terms.
            </p>
            
            {/* Wallet Connection Status */}
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 border border-white/20 mb-8">
              <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white font-medium">
                {isConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
              </span>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-white font-semibold text-lg mb-2">Trust-Based Scoring</h3>
                <p className="text-white/70 text-sm">
                  Advanced credit scoring system that evaluates your on-chain behavior and transaction history.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-white font-semibold text-lg mb-2">Instant Loans</h3>
                <p className="text-white/70 text-sm">
                  Get approved for loans instantly with no paperwork, no credit checks, and no waiting periods.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-white font-semibold text-lg mb-2">Flexible Management</h3>
                <p className="text-white/70 text-sm">
                  Extend, refinance, or repay your loans anytime with our comprehensive management tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <LoanDashboard />
    </div>
  );
};

export default LoanPlatform;
