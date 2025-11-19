import { useState, useCallback, useMemo } from "react";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

// Configuration
const NETWORK_CONFIG = {
  testnet: "https://fullnode.testnet.aptoslabs.com",
  mainnet: "https://fullnode.mainnet.aptoslabs.com",
} as const;

const MODULE_ADDRESS = process.env.REACT_APP_MODULE_ADDRESS || "0x<your_module_address>";
const NETWORK = (process.env.REACT_APP_NETWORK as keyof typeof NETWORK_CONFIG) || "testnet";

// Types
interface TrustScoreState {
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface TrustScoreHook {
  initTrustScore: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  clearError: () => void;
}

/**
 * Custom hook for managing trust score initialization
 */
export const useTrustScore = (): TrustScoreHook => {
  const { account, signAndSubmitTransaction } = useWallet();
  
  const [state, setState] = useState<TrustScoreState>({
    isLoading: false,
    error: null,
    isInitialized: false,
  });

  // Memoize the Aptos client
  const client = useMemo(() => {
    return new AptosClient(NETWORK_CONFIG[NETWORK]);
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const initTrustScore = useCallback(async (): Promise<void> => {
    if (!account?.address) {
      setState(prev => ({ ...prev, error: "Wallet not connected" }));
      return;
    }

    if (MODULE_ADDRESS.includes("<your_module_address>")) {
      setState(prev => ({ ...prev, error: "Module address not configured" }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const transaction = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::trust_score::init_trust_score`,
          functionArguments: [],
        },
      });
      
      // Wait for transaction to be confirmed
      await client.waitForTransaction(transaction.hash);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isInitialized: true 
      }));

      console.log("✅ TrustScore initialized successfully!", transaction.hash);
    } catch (error: unknown) {
      let errorMessage = "Failed to initialize trust score";
      
      if (error instanceof Error) {
        // Check for specific error conditions
        if (error.message.includes("already exists") || 
            error.message.includes("RESOURCE_ALREADY_EXISTS")) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isInitialized: true,
            error: null 
          }));
          console.log("ℹ️ TrustScore already initialized");
          return;
        }
        
        errorMessage = error.message;
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      console.error("❌ TrustScore initialization failed:", error);
    }
  }, [account, client, signAndSubmitTransaction]);

  return {
    initTrustScore,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,
    clearError,
  };
};
