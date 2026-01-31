import { useState, useCallback } from "react";


interface TrustScoreUpdateState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

interface TrustScoreUpdaterHook {
  state: TrustScoreUpdateState;
  updateTrustScore: (action: string) => Promise<void>;
  clearState: () => void;
}


export const useTrustScoreUpdater = (): TrustScoreUpdaterHook => {
  const [state, setState] = useState<TrustScoreUpdateState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const clearState = useCallback(() => {
    setState({ isLoading: false, error: null, success: false });
  }, []);

  const updateTrustScore = useCallback(async (action: string): Promise<void> => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: "Wallet not connected" }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, success: false }));

    try {
      
      console.log("Updating trust score with action:", action);
      
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true 
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || "Failed to update trust score"
      }));
    }
  }, []);

  return {
    state,
    updateTrustScore,
    clearState,
  };
};
