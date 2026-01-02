import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LoanRequestForm from "./LoanRequestForm";
import LoanManagementSystem from "./LoanManagementSystem";
import CountUp from "../reactbits/CountUp";
import ScaleIn from "../reactbits/ScaleIn";
import { motion } from "framer-motion";

const LOAN_CORE_ADDRESS = import.meta.env.VITE_LOAN_CORE_ADDRESS || "0x0000000000000000000000000000000000000000";
const REPUTATION_POINTS_ADDRESS = import.meta.env.VITE_REPUTATION_POINTS_ADDRESS || "0x0000000000000000000000000000000000000000";

const LOAN_CORE_ABI = [
  "function getUserLoans(address user) external view returns (uint256[])",
  "function getLoan(uint256 loanId) external view returns (tuple(address borrower, uint256 amount, uint256 collateralAmount, address collateralToken, uint256 interestRate, uint256 startTime, uint256 duration, uint256 outstandingAmount, uint8 status))"
];

const REPUTATION_POINTS_ABI = [
  "function reputations(address user) external view returns (uint256 points, uint8 tier, uint256 loansCompleted, uint256 onTimePayments)"
];

const isValidHexAddress = (address: string): boolean => {
  if (!address) return false;
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return /^[0-9a-fA-F]{64}$/.test(cleanAddress);
};

const formatAmount = (octas: string): string => {
  return (parseInt(octas) / 100000000).toFixed(2);
};

interface TrustScore {
  score: string;
  tier: string;
  loanCount: string;
  totalBorrowed: string;
  totalRepaid: string;
  defaults: string;
  lastUpdated: string;
  stakedAmount: string;
  walletAge: string;
  earlyRepayments: string;
  refinanceCount: string;
}

const LoanDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [userAddress, setUserAddress] = useState<string>("");
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isContractInitialized, setIsContractInitialized] = useState<boolean>(false);
  const [hasTrustScore, setHasTrustScore] = useState<boolean>(false);
  const [trustScoreData, setTrustScoreData] = useState<TrustScore | null>(null);
  const [maxLoanAmount, setMaxLoanAmount] = useState<string>("100");
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    const checkWallet = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0 && accounts[0]) {
            const address = accounts[0];
            setUserAddress(address);
            setIsWalletConnected(true);
            await loadUserData(address);
          }
        } else {
          setIsWalletConnected(false);
        }
      } catch (error) {
        console.log("Wallet not connected:", error);
        setIsWalletConnected(false);
      }
    };

    checkWallet();
  }, []);

  
  const loadUserData = async (address: string) => {
    if (!isValidHexAddress(address)) return;
    
    setIsLoading(true);
    setError(null);

    try {
      
      await checkContractAndTrustScore(address);
      
      
      await loadUserLoans(address);
      
    } catch (err: any) {
      console.error("Error loading user data:", err);
      setError("Failed to load user data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  
  const checkContractAndTrustScore = async (address: string) => {
    try {
      console.log("Checking contract and trust score for:", address);
      
      if (!window.ethereum) throw new Error("Wallet not connected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      
      const code = await provider.getCode(REPUTATION_POINTS_ADDRESS);
      if (code === "0x") {
        console.warn("Reputation contract not deployed at address");
        
        setHasTrustScore(false);
        return;
      }

      const reputationContract = new ethers.Contract(REPUTATION_POINTS_ADDRESS, REPUTATION_POINTS_ABI, provider);
      const repData = await (reputationContract as any).reputations(address);
      
      const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
      
      setTrustScoreData({
        score: repData.points.toString(),
        tier: tiers[repData.tier] || "Bronze",
        loanCount: repData.loansCompleted.toString(),
        totalBorrowed: "0",
        totalRepaid: "0",
        defaults: "0",
        lastUpdated: Date.now().toString(),
        stakedAmount: "0",
        walletAge: "0",
        earlyRepayments: repData.onTimePayments.toString(),
        refinanceCount: "0",
      });
      
      setIsContractInitialized(true);
      setHasTrustScore(true);
      setMaxLoanAmount("100");
      
    } catch (error: any) {
      console.log("Error checking contract status:", error);
      setIsContractInitialized(false);
      setHasTrustScore(false);
      setMaxLoanAmount("100");
    }
  };

  
  const loadUserLoans = async (address: string) => {
    try {
      console.log("Loading user loans for:", address);
      
      if (!window.ethereum) throw new Error("Wallet not connected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const loanContract = new ethers.Contract(LOAN_CORE_ADDRESS, LOAN_CORE_ABI, provider);
      
      const loanIds = await (loanContract as any).getUserLoans(address);
      const loadedLoans: any[] = [];

      for (const id of loanIds) {
        const loanData = await (loanContract as any).getLoan(id);
        loadedLoans.push({
          id: id.toString(),
          amount: loanData.amount.toString(),
          status: Number(loanData.status),
          createdAt: loanData.startTime.toString(),
        });
      }

      setUserLoans(loadedLoans);
      
    } catch (error: any) {
      console.error("Error loading user loans:", error);
      setUserLoans([]);
    }
  };
  
  
  const getLoanStatusText = (status: number): string => {
    switch (status) {
      case 0: return "Active";
      case 1: return "Repaid";
      case 2: return "Defaulted";
      case 3: return "Liquidated";
      default: return "Unknown";
    }
  };

  
  const getLoanStatusColor = (status: number): string => {
    switch (status) {
      case 0: return "text-yellow-400";
      case 1: return "text-green-400";
      case 2: return "text-red-400";
      case 3: return "text-red-600";
      default: return "text-gray-400";
    }
  };

  
  const totalBorrowed = userLoans.reduce((sum, loan) => sum + parseFloat(formatAmount(loan.amount)), 0);
  
  
  const totalRepaid = userLoans
    .filter(loan => loan.status === 1)
    .reduce((sum, loan) => sum + parseFloat(formatAmount(loan.amount)), 0);
  
  
  const activeLoans = userLoans.filter(loan => loan.status === 0);
  
  
  const defaultedLoans = userLoans.filter(loan => loan.status === 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="max-w-7xl mx-auto p-6">
        {}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">🏦 Elegant DeFi Loan Platform</h1>
          <p className="text-white/70">Decentralized lending with trust-based scoring on Ethereum</p>
        </motion.div>

        {}
        <ScaleIn delay={0.1}>
        <motion.div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10 mb-6 hover:border-white/30 transition-all" whileHover={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" }}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-semibold">Wallet Status</h3>
              <p className={`text-sm ${isWalletConnected ? "text-green-400" : "text-red-400"}`}>
                {isWalletConnected ? "Connected" : "Not Connected"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Address</p>
              <p className="text-green-400 font-mono text-xs">
                {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Contract</p>
              <p className={`text-sm ${isContractInitialized ? "text-green-400" : "text-red-400"}`}>
                {isContractInitialized ? "Ready" : "Not Initialized"}
              </p>
            </div>
          </div>
        </motion.div>
        </ScaleIn>

        {}
        <motion.div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          {[
            { id: "overview", label: "📊 Overview", icon: "📊" },
            { id: "request", label: "💰 Request Loan", icon: "💰" },
            { id: "manage", label: "⚙️ Manage Loans", icon: "⚙" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-white/70 mt-4">Loading your loan data...</p>
          </div>
        )}

        {}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-400 text-lg">❌</span>
              <span className="text-red-400 font-semibold">Error</span>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {}
        {!isLoading && (
          <>
            {}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {}
                {hasTrustScore && trustScoreData && (
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">📈 Trust Score Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-white/70 text-sm">Score</p>
                        <p className="text-2xl font-bold text-green-400">
                          <CountUp to={parseInt(trustScoreData.score)} duration={2} />
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/70 text-sm">Tier</p>
                        <p className="text-xl font-semibold text-blue-400">{trustScoreData.tier}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/70 text-sm">Max Loan</p>
                        <p className="text-xl font-semibold text-purple-400">
                          <CountUp to={parseFloat(maxLoanAmount)} decimals={2} suffix=" ETH" duration={2} />
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/70 text-sm">Loans</p>
                        <p className="text-xl font-semibold text-yellow-400">
                          <CountUp to={parseInt(trustScoreData.loanCount)} duration={2} />
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">📊 Loan Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/70">Total Borrowed:</span>
                        <span className="text-white font-semibold">
                          <CountUp to={totalBorrowed} decimals={2} suffix=" ETH" duration={2} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Total Repaid:</span>
                        <span className="text-green-400 font-semibold">
                          <CountUp to={totalRepaid} decimals={2} suffix=" ETH" duration={2} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Active Loans:</span>
                        <span className="text-yellow-400 font-semibold">
                          <CountUp to={activeLoans.length} duration={2} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Defaulted Loans:</span>
                        <span className="text-red-400 font-semibold">
                          <CountUp to={defaultedLoans.length} duration={2} />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">🎯 Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveTab("request")}
                        disabled={!isWalletConnected || !isContractInitialized || !hasTrustScore}
                        className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Request New Loan
                      </button>
                      <button
                        onClick={() => setActiveTab("manage")}
                        disabled={!isWalletConnected || userLoans.length === 0}
                        className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Manage Loans ({userLoans.length})
                      </button>
                    </div>
                  </div>
                </div>

                {}
                {userLoans.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">📋 Recent Loans</h3>
                    <div className="space-y-3">
                      {userLoans.slice(0, 5).map((loan) => (
                        <div key={loan.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-semibold">Loan #{loan.id}</p>
                            <p className="text-white/70 text-sm">{formatAmount(loan.amount)} ETH</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getLoanStatusColor(loan.status)}`}>
                              {getLoanStatusText(loan.status)}
                            </span>
                            <p className="text-white/70 text-xs mt-1">
                              {new Date(parseInt(loan.createdAt) * 1000).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {}
            {activeTab === "request" && (
              <LoanRequestForm />
            )}

            {}
            {activeTab === "manage" && (
              <LoanManagementSystem />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoanDashboard; 