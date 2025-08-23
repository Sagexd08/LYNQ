import React, { useState, useEffect } from "react";
import { AptosClient } from "aptos";

// Utility functions for validation
const isValidHexAddress = (address: string): boolean => {
  if (!address) return false;
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  // Check if it's a valid hex string with correct length (64 characters for Aptos addresses)
  return /^[0-9a-fA-F]{64}$/.test(cleanAddress);
};

const formatAddress = (address: string): string => {
  if (!address) return '';
  // Ensure it starts with 0x
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
    return { isValid: false, error: `Amount cannot exceed ${maxAmount} APT` };
  }
  
  return { isValid: true };
};

const LoanRequestForm: React.FC = () => {
  const [amount, setAmount] = useState<string>("");
  const [tokenType, setTokenType] = useState<string>("APT");
  const [collateralAddress, setCollateralAddress] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const contractAddress = "0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec";
  
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

  const client = new AptosClient("https://fullnode.testnet.aptoslabs.com");

  // Check wallet connection and get user address
  useEffect(() => {
    const checkWallet = async () => {
      try {
        if (window.aptos) {
          const account = await window.aptos.account();
          setUserAddress(account.address);
          setIsWalletConnected(true);
          await checkContractAndUserStatus(account.address);
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

  // Comprehensive status check with better error handling
  const checkContractAndUserStatus = async (address: string) => {
    try {
      // Validate address format
      if (!isValidHexAddress(address)) {
        console.error("Invalid address format:", address);
        return;
      }

      const trustScorePayload = {
        function: `${contractAddress}::elegent_defi_v2::get_trust_score`,
        type_arguments: [],
        arguments: [address],
      };
      
      try {
        const trustScoreResult = await client.view(trustScorePayload);
        console.log("Trust score result:", trustScoreResult);
        
        setIsContractInitialized(true);
        setHasTrustScore(true);
        setTrustScoreData(trustScoreResult);
        
        // Get max loan amount
        try {
          const maxLoanPayload = {
            function: `${contractAddress}::elegent_defi_v2::get_max_loan_amount`,
            type_arguments: [],
            arguments: [address],
          };
          
          const maxLoanResult = await client.view(maxLoanPayload);
          if (maxLoanResult && maxLoanResult[0]) {
            const maxLoanInAPT = (parseInt(String(maxLoanResult[0])) / 100000000).toFixed(2);
            setMaxLoanAmount(maxLoanInAPT);
          }
        } catch (maxLoanError) {
          console.log("Could not fetch max loan from contract, using default 100 APT");
          setMaxLoanAmount("100");
        }
        
      } catch (trustScoreError: any) {
        console.log("Trust score error:", trustScoreError);
        
        // Check for specific error codes
        const errorMessage = trustScoreError.message || '';
        if (errorMessage.includes("E_NOT_INITIALIZED") || 
            errorMessage.includes("0x60001") ||
            errorMessage.includes("not found")) {
          setIsContractInitialized(false);
          setHasTrustScore(false);
        } else {
          // Contract is initialized but user doesn't have trust score
          setIsContractInitialized(true);
          setHasTrustScore(false);
        }
        setMaxLoanAmount("100");
      }
      
    } catch (error: any) {
      console.log("Error checking contract status:", error);
      setIsContractInitialized(false);
      setHasTrustScore(false);
      setMaxLoanAmount("100");
    }
  };

  // Initialize the contract with better error handling
  const initializeContract = async () => {
    setIsInitializing(true);
    setError(null);
    setTxHash(null);
    setValidationErrors({});

    try {
      if (!window.aptos) throw new Error("Wallet not connected");

      const payload = {
        type: "entry_function_payload",
        function: `${contractAddress}::elegent_defi_v2::initialize`,
        type_arguments: [],
        arguments: [],
      };

      console.log("Initializing contract...");
      const tx = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Initialize tx:", tx);
      
      await client.waitForTransaction(tx.hash);

      setIsContractInitialized(true);
      setTxHash(tx.hash);
      
      // Refresh status
      await checkContractAndUserStatus(userAddress);
      
    } catch (err: any) {
      console.error("Initialization error:", err);
      let errorMessage = "Initialization failed.";
      
      if (err.message) {
        if (err.message.includes("insufficient balance")) {
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

  // Create trust score with better error handling
  const createTrustScore = async () => {
    setIsCreatingTrustScore(true);
    setError(null);
    setTxHash(null);
    setValidationErrors({});

    try {
      if (!window.aptos) throw new Error("Wallet not connected");

      const payload = {
        type: "entry_function_payload",
        function: `${contractAddress}::elegent_defi_v2::create_trust_score`,
        type_arguments: [],
        arguments: [],
      };

      console.log("Creating trust score...");
      const tx = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Trust score tx:", tx);
      
      await client.waitForTransaction(tx.hash);

      setHasTrustScore(true);
      setTxHash(tx.hash);
      
      // Refresh status
      await checkContractAndUserStatus(userAddress);
      
    } catch (err: any) {
      console.error("Trust score creation error:", err);
      let errorMessage = "Trust score creation failed.";
      
      if (err.message) {
        if (err.message.includes("already exists")) {
          errorMessage = "Trust score already exists for this account.";
        } else if (err.message.includes("insufficient balance")) {
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

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Validate amount
    const amountValidation = validateAmount(amount, maxLoanAmount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error!;
    }

    // Validate collateral address if provided
    if (collateralAddress.trim()) {
      const formattedAddress = formatAddress(collateralAddress.trim());
      if (!isValidHexAddress(formattedAddress)) {
        errors.collateralAddress = "Invalid collateral address format. Must be a valid Aptos address.";
      }
    }

    // Validate purpose length
    if (purpose.length > 100) {
      errors.purpose = "Purpose description is too long (max 100 characters).";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit loan request with comprehensive validation
  const handleLoanRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setTxHash(null);
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!window.aptos) throw new Error("Wallet not connected");
      if (!isContractInitialized) throw new Error("Contract not initialized");
      if (!hasTrustScore) throw new Error("Trust score required");

      // Convert amount to octas (1 APT = 10^8 octas)
      const amountInOctas = Math.floor(parseFloat(amount) * 100000000);
      
      // Format collateral address properly
      let collateralAddr = contractAddress; // default to contract address
      if (collateralAddress.trim()) {
        const formattedAddress = formatAddress(collateralAddress.trim());
        if (isValidHexAddress(formattedAddress)) {
          collateralAddr = formattedAddress;
        }
      }

      const payload = {
        type: "entry_function_payload",
        function: `${contractAddress}::elegent_defi_v2::request_loan`,
        type_arguments: [],
        arguments: [
          amountInOctas.toString(), // u64 amount
          purpose || tokenType,      // string token_type
          collateralAddr,           // address (collateral address)
        ],
      };

      console.log("Loan request payload:", payload);
      const tx = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Loan request tx:", tx);
      
      await client.waitForTransaction(tx.hash);

      setTxHash(tx.hash);
      
      // Reset form
      setAmount("");
      setPurpose("");
      setCollateralAddress("");
      
      // Refresh user data
      await checkContractAndUserStatus(userAddress);
      
    } catch (err: any) {
      console.error("Loan request error:", err);
      let errorMessage = "Loan request failed.";
      
      if (err.message) {
        if (err.message.includes("insufficient balance")) {
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

  // Handle collateral address input with validation
  const handleCollateralAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCollateralAddress(value);
    
    // Clear validation error when user starts typing
    if (validationErrors.collateralAddress) {
      setValidationErrors(prev => ({ ...prev, collateralAddress: "" }));
    }
  };

  // Handle amount input with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    
    // Clear validation error when user starts typing
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
      
      {/* User Status Dashboard */}
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
              <span className="text-blue-400 font-semibold">{maxLoanAmount} APT</span>
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Initialize Contract */}
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

      {/* Step 2: Create Trust Score */}
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

      {/* Step 3: Loan Request Form */}
      {isContractInitialized && hasTrustScore && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">💰 Request a Loan</h3>
          
          <form onSubmit={handleLoanRequest} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Loan Amount (APT) *
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
                placeholder={`Enter amount (max: ${maxLoanAmount} APT)`}
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
                <option value="APT" className="text-black bg-white">APT</option>
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
                placeholder="Business expansion, education, etc."
              />
              {validationErrors.purpose && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.purpose}</p>
              )}
              <p className="text-xs text-white/50 mt-1">
                {purpose.length}/100 characters
              </p>
            </div>

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

            <button
              type="submit"
              disabled={
                isLoading || 
                !amount || 
                parseFloat(amount) <= 0 || 
                parseFloat(amount) > parseFloat(maxLoanAmount) ||
                !isWalletConnected ||
                !isContractInitialized ||
                !hasTrustScore ||
                Object.keys(validationErrors).length > 0
              }
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? "Submitting Loan Request..." : 
               !isWalletConnected ? "Connect Wallet First" :
               !isContractInitialized ? "Initialize Contract First" :
               !hasTrustScore ? "Create Trust Score First" :
               parseFloat(amount) > parseFloat(maxLoanAmount) ? `Max loan is ${maxLoanAmount} APT` :
               Object.keys(validationErrors).length > 0 ? "Please fix validation errors" :
               "Submit Loan Request"}
            </button>
          </form>
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