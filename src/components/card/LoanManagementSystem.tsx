import React, { useState, useEffect } from "react";

import { AptosClient } from "aptos";

// Utility functions for validation
const isValidHexAddress = (address: string): boolean => {
  if (!address) return false;
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return /^[0-9a-fA-F]{64}$/.test(cleanAddress);
};

const formatAddress = (address: string): string => {
  if (!address) return '';
  const cleanAddress = address.startsWith('0x') ? address : `0x${address}`;
  return cleanAddress;
};

const formatAmount = (octas: string): string => {
  return (parseInt(octas) / 100000000).toFixed(2);
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
  interestAmount: string;
  dynamicInterestRate: string;
  dueDate: string;
  status: number;
  createdAt: string;
  lastExtended: string;
  extensionCount: string;
  collateralAmount: string;
}

const LoanManagementSystem: React.FC = () => {
  const [userAddress, setUserAddress] = useState<string>("");
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingLoans, setIsLoadingLoans] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Form states
  const [repaymentAmount, setRepaymentAmount] = useState<string>("");
  const [extensionDays, setExtensionDays] = useState<string>("30");
  const [refinanceAmount, setRefinanceAmount] = useState<string>("");
  
  const contractAddress = "0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec";
  const client = new AptosClient("https://fullnode.testnet.aptoslabs.com");

  // Check wallet connection
  useEffect(() => {
    const checkWallet = async () => {
      try {
        if (window.aptos) {
          const account = await window.aptos.account();
          setUserAddress(account.address);
          setIsWalletConnected(true);
          await loadUserLoans(account.address);
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

  // Load user loans
  const loadUserLoans = async (address: string) => {
    if (!isValidHexAddress(address)) return;
    
    setIsLoadingLoans(true);
    setError(null);

    try {
      const payload = {
        function: `${contractAddress}::elegent_defi_v2::get_user_loans`,
        type_arguments: [],
        arguments: [address, address], // borrower and lender are the same for user loans
      };

      const result = await client.view(payload);
      const loanIds = result[0] as string[];

      const loans: Loan[] = [];
      
      for (const loanId of loanIds) {
        try {
          const loanDetails = await getLoanDetails(loanId, address);
          if (loanDetails) {
            loans.push(loanDetails);
          }
        } catch (error) {
          console.error(`Error loading loan ${loanId}:`, error);
        }
      }

      setUserLoans(loans);
    } catch (err: any) {
      console.error("Error loading user loans:", err);
      setError("Failed to load user loans. Please try again.");
    } finally {
      setIsLoadingLoans(false);
    }
  };

  // Get loan details
  const getLoanDetails = async (loanId: string, borrower: string): Promise<Loan | null> => {
    try {
      const payload = {
        function: `${contractAddress}::elegent_defi_v2::get_loan_details`,
        type_arguments: [],
        arguments: [loanId, borrower],
      };

      const result = await client.view(payload);
      
      return {
        id: loanId,
        borrower: result[1] as string,
        tokenType: "APT", // Default for now
        amount: result[2] as string,
        interestAmount: result[3] as string,
        dynamicInterestRate: result[4] as string,
        dueDate: result[5] as string,
        status: parseInt(result[6] as string),
        createdAt: result[7] as string,
        lastExtended: result[8] as string,
        extensionCount: result[9] as string,
        collateralAmount: result[10] as string,
      };
    } catch (error) {
      console.error(`Error getting loan details for ${loanId}:`, error);
      return null;
    }
  };

  // Repay loan
  const handleRepayLoan = async () => {
    if (!selectedLoan || !repaymentAmount) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);

    try {
      if (!window.aptos) throw new Error("Wallet not connected");

      const amountInOctas = Math.floor(parseFloat(repaymentAmount) * 100000000);

      const payload = {
        type: "entry_function_payload",
        function: `${contractAddress}::elegent_defi_v2::repay_loan`,
        type_arguments: [],
        arguments: [
          selectedLoan.id,
          selectedLoan.borrower,
        ],
      };

      console.log("Repay loan payload:", payload);
      const tx = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Repay loan tx:", tx);
      
      await client.waitForTransaction(tx.hash);

      setTxHash(tx.hash);
      setSuccess("Loan repayment successful!");
      setRepaymentAmount("");
      setSelectedLoan(null);
      
      // Refresh loans
      await loadUserLoans(userAddress);
      
    } catch (err: any) {
      console.error("Repay loan error:", err);
      let errorMessage = "Loan repayment failed.";
      
      if (err.message) {
        if (err.message.includes("insufficient balance")) {
          errorMessage = "Insufficient balance to repay loan.";
        } else if (err.message.includes("loan not found")) {
          errorMessage = "Loan not found or already repaid.";
        } else if (err.message.includes("simulation failed")) {
          errorMessage = "Transaction simulation failed. Please check your inputs.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Extend loan
  const handleExtendLoan = async () => {
    if (!selectedLoan || !extensionDays) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);

    try {
      if (!window.aptos) throw new Error("Wallet not connected");

      const days = parseInt(extensionDays);
      if (isNaN(days) || days <= 0) {
        throw new Error("Invalid extension days");
      }

      const payload = {
        type: "entry_function_payload",
        function: `${contractAddress}::elegent_defi_v2::extend_loan`,
        type_arguments: [],
        arguments: [
          selectedLoan.id,
          selectedLoan.borrower,
        ],
      };

      console.log("Extend loan payload:", payload);
      const tx = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Extend loan tx:", tx);
      
      await client.waitForTransaction(tx.hash);

      setTxHash(tx.hash);
      setSuccess("Loan extension successful!");
      setExtensionDays("30");
      setSelectedLoan(null);
      
      // Refresh loans
      await loadUserLoans(userAddress);
      
    } catch (err: any) {
      console.error("Extend loan error:", err);
      let errorMessage = "Loan extension failed.";
      
      if (err.message) {
        if (err.message.includes("insufficient balance")) {
          errorMessage = "Insufficient balance to extend loan.";
        } else if (err.message.includes("loan not found")) {
          errorMessage = "Loan not found.";
        } else if (err.message.includes("already extended")) {
          errorMessage = "Loan has already been extended recently.";
        } else if (err.message.includes("simulation failed")) {
          errorMessage = "Transaction simulation failed. Please check your inputs.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refinance loan
  const handleRefinanceLoan = async () => {
    if (!selectedLoan || !refinanceAmount) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);

    try {
      if (!window.aptos) throw new Error("Wallet not connected");

      const amountInOctas = Math.floor(parseFloat(refinanceAmount) * 100000000);

      const payload = {
        type: "entry_function_payload",
        function: `${contractAddress}::elegent_defi_v2::refinance_loan`,
        type_arguments: [],
        arguments: [
          selectedLoan.id,
          selectedLoan.borrower,
        ],
      };

      console.log("Refinance loan payload:", payload);
      const tx = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Refinance loan tx:", tx);
      
      await client.waitForTransaction(tx.hash);

      setTxHash(tx.hash);
      setSuccess("Loan refinancing successful!");
      setRefinanceAmount("");
      setSelectedLoan(null);
      
      // Refresh loans
      await loadUserLoans(userAddress);
      
    } catch (err: any) {
      console.error("Refinance loan error:", err);
      let errorMessage = "Loan refinancing failed.";
      
      if (err.message) {
        if (err.message.includes("insufficient balance")) {
          errorMessage = "Insufficient balance to refinance loan.";
        } else if (err.message.includes("loan not found")) {
          errorMessage = "Loan not found.";
        } else if (err.message.includes("not eligible")) {
          errorMessage = "Loan is not eligible for refinancing.";
        } else if (err.message.includes("simulation failed")) {
          errorMessage = "Transaction simulation failed. Please check your inputs.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get loan status text
  const getLoanStatusText = (status: number): string => {
    switch (status) {
      case 0: return "Active";
      case 1: return "Repaid";
      case 2: return "Defaulted";
      case 3: return "Liquidated";
      default: return "Unknown";
    }
  };

  // Get loan status color
  const getLoanStatusColor = (status: number): string => {
    switch (status) {
      case 0: return "text-yellow-400";
      case 1: return "text-green-400";
      case 2: return "text-red-400";
      case 3: return "text-red-600";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">📊 Loan Management System</h2>
        <p className="text-white/70 text-sm">Manage your active loans and payments</p>
      </div>

      {/* Wallet Status */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10">
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
        </div>
      </div>

      {/* User Loans */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Your Loans</h3>
          <button
            onClick={() => loadUserLoans(userAddress)}
            disabled={isLoadingLoans || !isWalletConnected}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingLoans ? "Loading..." : "Refresh"}
          </button>
        </div>

        {isLoadingLoans ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-white/70 mt-2">Loading your loans...</p>
          </div>
        ) : userLoans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/70">No loans found. Request a loan to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userLoans.map((loan) => (
              <div
                key={loan.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedLoan?.id === loan.id
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedLoan(loan)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-white font-semibold">Loan #{loan.id}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getLoanStatusColor(loan.status)}`}>
                        {getLoanStatusText(loan.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-white/70">Amount</p>
                        <p className="text-white font-semibold">{formatAmount(loan.amount)} APT</p>
                      </div>
                      <div>
                        <p className="text-white/70">Interest</p>
                        <p className="text-white font-semibold">{formatAmount(loan.interestAmount)} APT</p>
                      </div>
                      <div>
                        <p className="text-white/70">Due Date</p>
                        <p className="text-white font-semibold">{formatDate(loan.dueDate)}</p>
                      </div>
                      <div>
                        <p className="text-white/70">Extensions</p>
                        <p className="text-white font-semibold">{loan.extensionCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loan Actions */}
      {selectedLoan && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Loan Actions - #{selectedLoan.id}</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Repay Loan */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Repay Loan</h4>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                placeholder="Amount in APT"
              />
              <button
                onClick={handleRepayLoan}
                disabled={isLoading || !repaymentAmount || selectedLoan.status !== 0}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Repay Loan"}
              </button>
            </div>

            {/* Extend Loan */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Extend Loan</h4>
              <select
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
              >
                <option value="7" className="text-black bg-white">7 days</option>
                <option value="15" className="text-black bg-white">15 days</option>
                <option value="30" className="text-black bg-white">30 days</option>
                <option value="60" className="text-black bg-white">60 days</option>
              </select>
              <button
                onClick={handleExtendLoan}
                disabled={isLoading || selectedLoan.status !== 0}
                className="w-full bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Extend Loan"}
              </button>
            </div>

            {/* Refinance Loan */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Refinance Loan</h4>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                value={refinanceAmount}
                onChange={(e) => setRefinanceAmount(e.target.value)}
                placeholder="New amount in APT"
              />
              <button
                onClick={handleRefinanceLoan}
                disabled={isLoading || !refinanceAmount || selectedLoan.status !== 0}
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Refinance Loan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Results */}
      {txHash && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-400 text-lg">✅</span>
            <span className="text-green-400 font-semibold">Transaction Successful!</span>
          </div>
          <p className="text-green-300 text-sm">
            View on Explorer:{" "}
            <a
              className="underline hover:text-green-200 font-mono"
              href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash.slice(0, 12)}...{txHash.slice(-8)}
            </a>
          </p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-400 text-lg">✅</span>
            <span className="text-green-400 font-semibold">{success}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-400 text-lg">❌</span>
            <span className="text-red-400 font-semibold">Error</span>
          </div>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default LoanManagementSystem;
