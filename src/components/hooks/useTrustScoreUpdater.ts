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
interface TrustScoreUpdateState {
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface TrustScoreUpdaterHook {
  updateTrustScore: (delta?: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  clearError: () => void;
}

// Constants
const DEFAULT_DELTA = 5;
const MIN_DELTA = -100;
const MAX_DELTA = 100;

/**
 * Custom hook for updating trust scores
 */
export const useTrustScoreUpdater = (): TrustScoreUpdaterHook => {
  const { account, signAndSubmitTransaction } = useWallet();
  
  const [state, setState] = useState<TrustScoreUpdateState>({
    isLoading: false,
    error: null,
    lastUpdate: null,
  });

  // Memoize the Aptos client
  const client = useMemo(() => {
    return new AptosClient(NETWORK_CONFIG[NETWORK]);
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const validateDelta = useCallback((delta: number): boolean => {
    return Number.isInteger(delta) && delta >= MIN_DELTA && delta <= MAX_DELTA;
  }, []);

  const updateTrustScore = useCallback(async (delta: number = DEFAULT_DELTA): Promise<void> => {
    if (!account?.address) {
      setState(prev => ({ ...prev, error: "Wallet not connected" }));
      return;
    }

    if (MODULE_ADDRESS.includes("<your_module_address>")) {
      setState(prev => ({ ...prev, error: "Module address not configured" }));
      return;
    }

    if (!validateDelta(delta)) {
      setState(prev => ({ 
        ...prev, 
        error: `Invalid delta value. Must be an integer between ${MIN_DELTA} and ${MAX_DELTA}` 
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const transaction = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::trust_score::update_score`,
          functionArguments: [delta],
        },
      });

      // Wait for transaction confirmation
      await client.waitForTransaction(transaction.hash);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastUpdate: new Date() 
      }));

      console.log(`✅ TrustScore updated by ${delta}. Transaction: ${transaction.hash}`);
    } catch (error: unknown) {
      let errorMessage = "Failed to update trust score";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      console.error("❌ TrustScore update failed:", error);
    }
  }, [account, client, signAndSubmitTransaction, validateDelta]);

  return {
    updateTrustScore,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    clearError,
  };
};
