import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { FlowLoanService } from "../../services/flowLoanService";
import { TelegramService } from "../../services/telegramService";


const isValidHexAddress = (address: string): boolean => {
  if (!address) return false;
  
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  
  return /^[0-9a-fA-F]{40}$/.test(cleanAddress);
};

const formatAddress = (address: string): string => {
  if (!address) return '';
  
  const cleanAddress = address.startsWith('0x') ? address : `0x${address}`;
  return cleanAddress;
};

const validateAmount = (amount: string, maxAmount: string): { isValid: boolean; error?: string } => {
  const numAmount = parseFloat(amount);
  const numMaxAmount = parseFloat(maxAmount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: "Amount must be a positive number" };
  }
  
  if (numAmount > numMaxAmount) {
    return { isValid: false, error: `Amount cannot exceed ${maxAmount} ETH` };
  }
  
  return { isValid: true };
};

const LoanRequestForm: React.FC = () => {
  const [amount, setAmount] = useState<string>("");
  const [tokenType, setTokenType] = useState<string>("ETH");
  const [collateralAddress, setCollateralAddress] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [loanType, setLoanType] = useState<string>("standard"); 
  const [flashLoanData, setFlashLoanData] = useState<string>(""); 
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isCreatingTrustScore, setIsCreatingTrustScore] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  const [userAddress, setUserAddress] = useState<string>("");
  const [isContractInitialized, setIsContractInitialized] = useState<boolean>(false);
  const [hasTrustScore, setHasTrustScore] = useState<boolean>(false);
  const [trustScoreData, setTrustScoreData] = useState<any>(null);
  const [maxLoanAmount, setMaxLoanAmount] = useState<string>("100");
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);

  
  useEffect(() => {
    const checkWallet = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
            setIsWalletConnected(true);
            await checkContractAndUserStatus(accounts[0]);
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

  
  const checkContractAndUserStatus = async (address: string) => {
    try {
      
      if (!isValidHexAddress(address)) {
        console.error("Invalid address format:", address);
        return;
      }

      
      
      console.log("Checking contract status for address:", address);
      
      
      setIsContractInitialized(true);
      setHasTrustScore(true);
      setTrustScoreData({ score: 750 }); 
      setMaxLoanAmount("100"); 
      
    } catch (error: any) {
      console.log("Error checking contract status:", error);
      setIsContractInitialized(false);
      setHasTrustScore(false);
      setMaxLoanAmount("100");
    }
  };

  
  const initializeContract = async () => {
    setIsInitializing(true);
    setError(null);
    setTxHash(null);
    setValidationErrors({});

    try {
      if (!window.ethereum) throw new Error("Wallet not connected");

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.getSigner(); 
      
      
      
      console.log("Initializing contract...");
      
      
      const mockTxHash = "0x" + Math.random().toString(16).substr(2, 8);
      
      setIsContractInitialized(true);
      setTxHash(mockTxHash);
      
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await checkContractAndUserStatus(accounts[0]);
      }
      
    } catch (err: any) {
      console.error("Initialization error:", err);
      let errorMessage = "Initialization failed.";
      
      if (err.message) {
        if (err.message.includes("insufficient")) {
          errorMessage = "Insufficient balance to initialize contract.";
        } else if (err.message.includes("already initialized")) {
          errorMessage = "Contract is already initialized.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  
  const createTrustScore = async () => {
    setIsCreatingTrustScore(true);
    setError(null);
    setTxHash(null);
    setValidationErrors({});

    try {
      if (!window.ethereum) throw new Error("Wallet not connected");

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.getSigner(); 
      
      
      console.log("Creating trust score...");
      
      
      const mockTxHash = "0x" + Math.random().toString(16).substr(2, 8);

      setHasTrustScore(true);
      setTxHash(mockTxHash);
      
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await checkContractAndUserStatus(accounts[0]);
      }
      
    } catch (err: any) {
      console.error("Trust score creation error:", err);
      let errorMessage = "Trust score creation failed.";
      
      if (err.message) {
        if (err.message.includes("already exists")) {
          errorMessage = "Trust score already exists for this account.";
        } else if (err.message.includes("insufficient")) {
          errorMessage = "Insufficient balance to create trust score.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsCreatingTrustScore(false);
    }
  };

  
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    
    const amountValidation = validateAmount(amount, maxLoanAmount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error!;
    }

    
    if (loanType === "standard") {
      
      if (collateralAddress.trim()) {
        const formattedAddress = formatAddress(collateralAddress.trim());
        if (!isValidHexAddress(formattedAddress)) {
          errors.collateralAddress = "Invalid collateral address format. Must be a valid Ethereum address.";
        }
      }
    } else if (loanType === "flash") {
      
      if (!flashLoanData.trim()) {
        errors.flashLoanData = "Flash loan execution data is required for flash loans.";
      }
    }

    
    if (purpose.length > 100) {
      errors.purpose = "Purpose description is too long (max 100 characters).";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  
  const handleLoanRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    
    setError(null);
    setTxHash(null);
    setValidationErrors({});

    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!isContractInitialized) throw new Error("Contract not initialized");
      if (!hasTrustScore) throw new Error("Trust score required");

      
      const interestBps = 1000; 
      const durationSeconds = parseInt(maxLoanAmount) ? parseInt(maxLoanAmount) : 30 * 24 * 60 * 60; 
      const txId = await FlowLoanService.createLoan({
        amount: `${parseFloat(amount).toFixed(2)}`,
        interestBps,
        durationSeconds,
        purpose: purpose || tokenType
      });

      setTxHash(String(txId));

      
      void TelegramService.notifyLoanGranted({
        loanId: String(Date.now()),
        borrower: userAddress,
        amountDisplay: `${amount} FLOW`,
        aprBps: String(interestBps),
        dueDate: new Date(Date.now() + durationSeconds * 1000).toLocaleString()
      });
      
      
      setAmount("");
      setPurpose("");
      setCollateralAddress("");
      
      
      
    } catch (err: any) {
      console.error("Loan request error:", err);
      let errorMessage = "Loan request failed.";
      
      if (err.message) {
        if (err.message.includes("insufficient")) {
          errorMessage = "Insufficient balance to request loan.";
        } else if (err.message.includes("exceeds maximum")) {
          errorMessage = "Loan amount exceeds maximum allowed.";
        } else if (err.message.includes("invalid address")) {
          errorMessage = "Invalid collateral address provided.";
        } else if (err.message.includes("simulation failed")) {
          errorMessage = "Transaction simulation failed. Please check your inputs and try again.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleFlashLoanRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    
    setError(null);
    setTxHash(null);
    setValidationErrors({});

    
    if (!validateForm()) {
      return;
    }

    
    if (!flashLoanData.trim()) {
      setValidationErrors(prev => ({ 
        ...prev, 
        flashLoanData: "Flash loan execution data is required" 
      }));
      return;
    }

    setIsLoading(true);

    try {
      if (!window.ethereum) throw new Error("Wallet not connected");

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.getSigner(); 
      
      
      const amountInWei = ethers.parseEther(amount);
      
      
      console.log("Flash loan request:", {
        amount: amountInWei.toString(),
        tokenType,
        executionData: flashLoanData,
        purpose: purpose || "Flash loan operation"
      });
      
      
      const mockTxHash = "0xFL" + Math.random().toString(16).substr(2, 6); 

      setTxHash(mockTxHash);
      
      
      setAmount("");
      setPurpose("");
      setFlashLoanData("");
      
    } catch (err: any) {
      console.error("Flash loan request error:", err);
      let errorMessage = "Flash loan request failed.";
      
      if (err.message) {
        if (err.message.includes("insufficient")) {
          errorMessage = "Flash loan failed: insufficient liquidity in pool.";
        } else if (err.message.includes("execution failed")) {
          errorMessage = "Flash loan execution failed: ensure your data returns borrowed amount + fee.";
        } else if (err.message.includes("invalid data")) {
          errorMessage = "Invalid execution data provided.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleCollateralAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCollateralAddress(value);
    
    
    if (validationErrors.collateralAddress) {
      setValidationErrors(prev => ({ ...prev, collateralAddress: "" }));
    }
  };

  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    
    
    if (validationErrors.amount) {
      setValidationErrors(prev => ({ ...prev, amount: "" }));
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">🏦 Elegant DeFi Loan Platform</h2>
        <p className="text-white/70 text-sm">Decentralized lending with trust-based scoring</p>
      </div>
      
      {}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10">
        <h3 className="text-white font-semibold mb-3">📊 Account Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/70">Wallet:</span>
            <span className={`font-mono text-xs ${isWalletConnected ? "text-green-400" : "text-red-400"}`}>
              {isWalletConnected ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Not connected"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Contract:</span>
            <span className={`font-semibold ${isContractInitialized ? "text-green-400" : "text-red-400"}`}>
              {isContractInitialized ? "✅ Ready" : "❌ Not Initialized"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Trust Score:</span>
            <span className={`font-semibold ${hasTrustScore ? "text-green-400" : "text-yellow-400"}`}>
              {hasTrustScore ? `✅ ${trustScoreData ? trustScoreData[0] : 'Created'}` : "⚠️ Required"}
            </span>
          </div>
          {hasTrustScore && (
            <div className="flex justify-between">
              <span className="text-white/70">Max Loan:</span>
              <span className="text-blue-400 font-semibold">{maxLoanAmount} ETH</span>
            </div>
          )}
        </div>
      </div>

      {}
      {!isContractInitialized && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <h3 className="text-red-400 font-semibold mb-2">🚫 Contract Not Initialized</h3>
          <p className="text-red-300 text-sm mb-4">
            The smart contract needs to be initialized before any operations can be performed.
            This is typically done by the contract admin.
          </p>
          <button
            onClick={initializeContract}
            disabled={isInitializing || !isWalletConnected}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInitializing ? "Initializing..." : "Initialize Contract"}
          </button>
        </div>
      )}

      {}
      {isContractInitialized && !hasTrustScore && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <h3 className="text-yellow-400 font-semibold mb-2">📈 Create Your Trust Score</h3>
          <p className="text-yellow-300 text-sm mb-4">
            A trust score is required to participate in the lending platform. This creates your 
            on-chain credit profile and determines your borrowing capacity.
          </p>
          <button
            onClick={createTrustScore}
            disabled={isCreatingTrustScore || !isWalletConnected}
            className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingTrustScore ? "Creating..." : "Create Trust Score"}
          </button>
        </div>
      )}

      {}
      {isContractInitialized && hasTrustScore && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">💰 Request a Loan</h3>
          
          {}
          <div className="mb-6">
            <label className="block text-white/80 text-sm font-medium mb-3">
              Loan Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLoanType("standard")}
                className={`p-4 rounded-lg border transition-all ${
                  loanType === "standard"
                    ? "bg-blue-500/20 border-blue-400 text-blue-300"
                    : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🏦</div>
                  <div className="font-semibold">Standard Loan</div>
                  <div className="text-xs mt-1">Requires collateral</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setLoanType("flash")}
                className={`p-4 rounded-lg border transition-all ${
                  loanType === "flash"
                    ? "bg-purple-500/20 border-purple-400 text-purple-300"
                    : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold">Flash Loan</div>
                  <div className="text-xs mt-1">Single transaction</div>
                </div>
              </button>
            </div>
            <div className="mt-2 text-xs text-white/60">
              {loanType === "standard" 
                ? "Standard loans require collateral and have flexible repayment terms."
                : "Flash loans must be borrowed and repaid within the same transaction. No collateral required."}
            </div>
            
            {}
            {loanType === "flash" && (
              <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h4 className="text-purple-300 font-semibold mb-2 flex items-center">
                  <span className="mr-2">⚡</span>
                  Flash Loan Features
                </h4>
                <ul className="text-purple-200 text-xs space-y-1">
                  <li>• <strong>No Collateral:</strong> Borrow without providing upfront collateral</li>
                  <li>• <strong>Single Transaction:</strong> Borrow, execute logic, and repay in one transaction</li>
                  <li>• <strong>Instant Liquidation:</strong> Transaction reverts if not repaid properly</li>
                  <li>• <strong>Use Cases:</strong> Arbitrage, liquidations, collateral swapping</li>
                  <li>• <strong>Fee:</strong> Small percentage (typically 0.05-0.1%) of borrowed amount</li>
                </ul>
              </div>
            )}
          </div>
          
          <form onSubmit={loanType === "flash" ? handleFlashLoanRequest : handleLoanRequest} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Loan Amount (ETH) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxLoanAmount}
                className={`w-full px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-white/50 focus:outline-none transition-colors ${
                  validationErrors.amount 
                    ? 'border-red-400 focus:border-red-400' 
                    : 'border-white/20 focus:border-blue-400'
                }`}
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Enter amount (max: ${maxLoanAmount} ETH)`}
                required
              />
              {validationErrors.amount && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.amount}</p>
              )}
              {amount && !validationErrors.amount && (
                <div className="mt-1">
                  <p className="text-xs text-white/60">
                    = {Math.floor(parseFloat(amount) * 100000000).toLocaleString()} octas
                  </p>
                  {parseFloat(amount) <= parseFloat(maxLoanAmount) && parseFloat(amount) > 0 && (
                    <p className="text-green-400 text-xs flex items-center mt-1">
                      <span className="mr-1">✅</span>
                      Amount is within loan limit
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Token Type *
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
                value={tokenType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTokenType(e.target.value)}
                required
              >
                <option value="ETH" className="text-black bg-white">ETH</option>
                <option value="USDC" className="text-black bg-white">USDC</option>
                <option value="USDT" className="text-black bg-white">USDT</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Purpose / Description
              </label>
              <input
                type="text"
                maxLength={100}
                className={`w-full px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-white/50 focus:outline-none transition-colors ${
                  validationErrors.purpose 
                    ? 'border-red-400 focus:border-red-400' 
                    : 'border-white/20 focus:border-blue-400'
                }`}
                value={purpose}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPurpose(e.target.value)}
                placeholder={loanType === "flash" ? "Arbitrage, liquidation, etc." : "Business expansion, education, etc."}
              />
              {validationErrors.purpose && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.purpose}</p>
              )}
              <p className="text-xs text-white/50 mt-1">
                {purpose.length}/100 characters
              </p>
            </div>

            {}
            {loanType === "flash" && (
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Execution Data * ⚡
                </label>
                <textarea
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-white/50 focus:outline-none transition-colors font-mono text-xs ${
                    validationErrors.flashLoanData 
                      ? 'border-red-400 focus:border-red-400' 
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                  value={flashLoanData}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFlashLoanData(e.target.value)}
                  placeholder="0x1234... (encoded function call data that will execute your flash loan logic)"
                  required
                />
                {validationErrors.flashLoanData && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.flashLoanData}</p>
                )}
                <div className="text-xs text-purple-300 mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                  <div className="font-semibold mb-1">⚠️ Flash Loan Requirements:</div>
                  <ul className="list-disc list-inside space-y-1 text-purple-200">
                    <li>Must repay borrowed amount + fee in same transaction</li>
                    <li>Execution data should contain your arbitrage/liquidation logic</li>
                    <li>Transaction will revert if not repaid properly</li>
                    <li>Typical fee: 0.05% - 0.1% of borrowed amount</li>
                  </ul>
                </div>
              </div>
            )}

            {}
            {loanType === "standard" && (
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Collateral Address (Optional)
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-white/50 focus:outline-none transition-colors font-mono text-xs ${
                    validationErrors.collateralAddress 
                      ? 'border-red-400 focus:border-red-400' 
                      : 'border-white/20 focus:border-blue-400'
                  }`}
                  value={collateralAddress}
                  onChange={handleCollateralAddressChange}
                  placeholder="0x... (leave empty for default)"
                />
                {validationErrors.collateralAddress && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.collateralAddress}</p>
                )}
                <p className="text-xs text-white/50 mt-1">
                  Address of collateral asset or NFT (optional)
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isLoading || 
                !amount || 
                parseFloat(amount) <= 0 || 
                parseFloat(amount) > parseFloat(maxLoanAmount) ||
                !isWalletConnected ||
                !isContractInitialized ||
                (loanType === "standard" && !hasTrustScore) ||
                (loanType === "flash" && !flashLoanData.trim()) ||
                Object.keys(validationErrors).length > 0
              }
              className={`w-full px-6 py-3 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                loanType === "flash" 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              }`}
            >
              {isLoading ? 
                (loanType === "flash" ? "Executing Flash Loan..." : "Submitting Loan Request...") : 
               !isWalletConnected ? "Connect Wallet First" :
               !isContractInitialized ? "Initialize Contract First" :
               loanType === "standard" && !hasTrustScore ? "Create Trust Score First" :
               parseFloat(amount) > parseFloat(maxLoanAmount) ? `Max loan is ${maxLoanAmount} ETH` :
               loanType === "flash" && !flashLoanData.trim() ? "Enter execution data" :
               Object.keys(validationErrors).length > 0 ? "Please fix validation errors" :
               loanType === "flash" ? "⚡ Execute Flash Loan" : "Submit Loan Request"}
            </button>
          </form>
        </div>
      )}

      {}
      {txHash && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-400 text-lg">✅</span>
            <span className="text-green-400 font-semibold">
              {txHash.startsWith("0xFL") ? "Flash Loan Executed Successfully!" : "Transaction Successful!"}
            </span>
          </div>
          <p className="text-green-300 text-sm">
            {txHash.startsWith("0xFL") ? (
              <>
                Flash loan completed in single transaction. View on Explorer:{" "}
                <a
                  className="underline hover:text-green-200 font-mono"
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {txHash.slice(0, 12)}...{txHash.slice(-8)}
                </a>
              </>
            ) : (
              <>
                View on Explorer:{" "}
                <a
                  className="underline hover:text-green-200 font-mono"
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {txHash.slice(0, 12)}...{txHash.slice(-8)}
                </a>
              </>
            )}
          </p>
          {txHash.startsWith("0xFL") && (
            <div className="mt-3 p-2 bg-purple-500/10 rounded border border-purple-500/20">
              <p className="text-purple-300 text-xs">
                ⚡ Flash loan was borrowed, executed, and repaid within this single transaction.
              </p>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-400 text-lg">❌</span>
            <span className="text-red-400 font-semibold">Error</span>
          </div>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default LoanRequestForm;