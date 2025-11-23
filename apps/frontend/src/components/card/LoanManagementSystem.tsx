import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { TelegramService } from "../../services/telegramService";

const LOAN_CORE_ADDRESS = import.meta.env.VITE_LOAN_CORE_ADDRESS || "0x0000000000000000000000000000000000000000";
const LOAN_CORE_ABI = [
  "function createLoan(uint256 amount, uint256 collateralAmount, address collateralToken, uint256 interestRate, uint256 duration) external returns (uint256)",
  "function repayLoan(uint256 loanId, uint256 amount) external",
  "function getLoan(uint256 loanId) external view returns (tuple(address borrower, uint256 amount, uint256 collateralAmount, address collateralToken, uint256 interestRate, uint256 startTime, uint256 duration, uint256 outstandingAmount, uint8 status))",
  "function getUserLoans(address user) external view returns (uint256[])",
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateralAmount)",
  "event LoanRepaid(uint256 indexed loanId, uint256 amount)"
];

const formatAmount = (wei: string): string => {
  return ethers.formatEther(wei);
};

const formatDate = (timestamp: string): string => {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

interface Loan {
  id: string;
  borrower: string;
  tokenType: string;
  amount: string;
  interestRate: string;
  interestAmount: string;
  dueDate: string;
  status: string;
  reputation: string;
  purpose: string;
}

interface LoanManagementSystemProps {
  walletAddress?: string;
}

const LoanManagementSystem: React.FC<LoanManagementSystemProps> = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [newLoanAmount, setNewLoanAmount] = useState<string>("");
  const [newLoanDuration, setNewLoanDuration] = useState<string>("30");
  const [newLoanPurpose, setNewLoanPurpose] = useState<string>("");
  const [newCollateralAddress, setNewCollateralAddress] = useState<string>("");
  const [newCollateralAmount, setNewCollateralAmount] = useState<string>("");
  const [repayLoanId, setRepayLoanId] = useState<string>("");
  const [repayAmount, setRepayAmount] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        setError(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    init();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
      setError(null);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setError(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fetchLoans = async () => {
    if (!currentAccount) return;
    
    setIsLoading(true);
    try {
      if (!window.ethereum) throw new Error("Wallet not connected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(LOAN_CORE_ADDRESS, LOAN_CORE_ABI, provider);
      
      const loanIds = await (contract as any).getUserLoans(currentAccount);
      const loadedLoans: Loan[] = [];

      for (const id of loanIds) {
        const loanData = await (contract as any).getLoan(id);
        const statusMap = ["pending", "active", "repaid", "defaulted", "liquidated"];
        
        loadedLoans.push({
          id: id.toString(),
          borrower: loanData.borrower,
          tokenType: "ETH",
          amount: loanData.amount.toString(),
          interestRate: loanData.interestRate.toString(),
          interestAmount: (BigInt(loanData.amount) * BigInt(loanData.interestRate) / 10000n).toString(),
          dueDate: (BigInt(loanData.startTime) + BigInt(loanData.duration)).toString(),
          status: statusMap[Number(loanData.status)] || "unknown",
          reputation: "N/A",
          purpose: "Loan #" + id.toString()
        });
      }
      
      setLoans(loadedLoans);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      setError(`Failed to fetch loans: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createLoan = async () => {
    if (!currentAccount || !newLoanAmount || !newLoanDuration || !newLoanPurpose || !newCollateralAddress || !newCollateralAmount) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      if (!window.ethereum) throw new Error("Wallet not connected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LOAN_CORE_ADDRESS, LOAN_CORE_ABI, signer);

      const amountWei = ethers.parseEther(newLoanAmount);
      const durationSeconds = parseInt(newLoanDuration) * 24 * 60 * 60;
      const interestBps = 1000;
      
      const collateralAmountWei = ethers.parseEther(newCollateralAmount);
      const collateralTokenAddr = newCollateralAddress;

      const erc20Abi = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ];
      const collateralContract = new ethers.Contract(collateralTokenAddr, erc20Abi, signer);
      
      console.log("Approving collateral...");
      const approveTx = await (collateralContract as any).approve(LOAN_CORE_ADDRESS, collateralAmountWei);
      await approveTx.wait();
      console.log("Collateral approved");

      const tx = await (contract as any).createLoan(
        amountWei,
        collateralAmountWei,
        collateralTokenAddr,
        interestBps,
        durationSeconds
      );
      
      setTxHash(tx.hash);
      await tx.wait();

      await fetchLoans(); // Refresh list

      const amountDisplay = newLoanAmount + ' ETH';
      void TelegramService.notifyLoanGranted({
        loanId: "Pending",
        borrower: currentAccount,
        amountDisplay,
        aprBps: String(interestBps),
        dueDate: new Date(Date.now() + durationSeconds * 1000).toLocaleString()
      });
      setNewLoanAmount("");
      setNewLoanDuration("30");
      setNewLoanPurpose("");
      setNewCollateralAddress("");
      setNewCollateralAmount("");
      setError(null);
    } catch (error) {
      console.error("Failed to create loan:", error);
      setError(`Failed to create loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const repayLoan = async () => {
    if (!currentAccount || !repayLoanId || !repayAmount) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      if (!window.ethereum) throw new Error("Wallet not connected");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LOAN_CORE_ADDRESS, LOAN_CORE_ABI, signer);
      
      const amountWei = ethers.parseEther(repayAmount);
      const tx = await (contract as any).repayLoan(repayLoanId, amountWei);
      
      setTxHash(tx.hash);
      await tx.wait();

      await fetchLoans(); // Refresh list

      setRepayLoanId("");
      setRepayAmount("");
      setError(null);
    } catch (error) {
      console.error("Failed to repay loan:", error);
      setError(`Failed to repay loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAccount) {
      fetchLoans();
    }
  }, [currentAccount]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Ethereum Loan Management System
        </h1>
        {!currentAccount ? (
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-sm">
            <div className="text-white/70">Connected:</div>
            <div className="font-mono text-cyan-400">
              {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {txHash && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-200">
            Transaction successful!{" "}
            <a
              className="text-cyan-400 hover:text-cyan-300 underline"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://etherscan.io/tx/${txHash}`}
            >
              View on Etherscan
            </a>
          </p>
        </div>
      )}

      {currentAccount && (
        <div className="space-y-8">
          {}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Loans</h2>
              <button
                onClick={fetchLoans}
                disabled={isLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loans.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <p>No loans found. Create your first loan below!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {loans.map((loan) => (
                  <div
                    key={loan.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="text-white/60 text-sm">Loan Amount</p>
                          <p className="text-white font-semibold">{formatAmount(loan.amount)} ETH</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Interest</p>
                          <p className="text-white font-semibold">{formatAmount(loan.interestAmount)} ETH</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Due Date</p>
                          <p className="text-white font-semibold">{formatDate(loan.dueDate)}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Status</p>
                          <p className={`font-semibold ${
                            loan.status === 'active' ? 'text-green-400' : 
                            loan.status === 'repaid' ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {loan.purpose && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-white/60 text-sm">Purpose: {loan.purpose}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Loan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="number"
                step="0.01"
                value={newLoanAmount}
                onChange={(e) => setNewLoanAmount(e.target.value)}
                placeholder="Amount in ETH"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
              />
              <select
                value={newLoanDuration}
                onChange={(e) => setNewLoanDuration(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="7" className="text-black">7 days</option>
                <option value="30" className="text-black">30 days</option>
                <option value="90" className="text-black">90 days</option>
                <option value="180" className="text-black">180 days</option>
              </select>
              <input
                type="text"
                value={newLoanPurpose}
                onChange={(e) => setNewLoanPurpose(e.target.value)}
                placeholder="Loan purpose"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                value={newCollateralAddress}
                onChange={(e) => setNewCollateralAddress(e.target.value)}
                placeholder="Collateral Address (0x...)"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="number"
                step="0.000001"
                value={newCollateralAmount}
                onChange={(e) => setNewCollateralAmount(e.target.value)}
                placeholder="Collateral Amount"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={createLoan}
                disabled={isLoading || !newLoanAmount || !newLoanDuration || !newLoanPurpose || !newCollateralAddress || !newCollateralAmount}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all"
              >
                {isLoading ? "Creating..." : "Create Loan"}
              </button>
            </div>
          </div>

          {}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Repay Loan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                value={repayLoanId}
                onChange={(e) => setRepayLoanId(e.target.value)}
                placeholder="Loan ID"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="number"
                step="0.01"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="New amount in ETH"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={repayLoan}
                disabled={isLoading || !repayLoanId || !repayAmount}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all"
              >
                {isLoading ? "Processing..." : "Repay Loan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!currentAccount && (
        <div className="text-center py-12">
          <p className="text-white/60 mb-4">Connect your Ethereum wallet to manage loans</p>
          <button
            onClick={connectWallet}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default LoanManagementSystem;
