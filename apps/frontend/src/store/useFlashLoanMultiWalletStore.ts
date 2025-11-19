import { create } from 'zustand';
import { ethers } from 'ethers';

export interface MultiWalletBatchData {
  batchId: string;
  asset: string;
  totalAmount: string;
  premium: string;
  recipients: string[];
  allocations: string[];
  initiator: string;
  timestamp: number;
  success: boolean;
  failureReason?: string;
  txHash?: string;
}

export interface MultiWalletFlashLoanState {
  // Form state
  formData: {
    asset: string;
    totalAmount: string;
    recipients: Array<{ address: string; amount: string }>;
    receiverContract: string;
  };

  // Execution state
  isExecuting: boolean;
  currentBatchId: string | null;
  lastError: string | null;
  quote: any | null;
  riskScore: number | null;

  // History state
  userBatches: MultiWalletBatchData[];
  isLoadingHistory: boolean;

  // Form actions
  setAsset: (asset: string) => void;
  setTotalAmount: (amount: string) => void;
  setReceiverContract: (address: string) => void;
  addRecipient: (address: string, amount: string) => void;
  updateRecipient: (index: number, address: string, amount: string) => void;
  removeRecipient: (index: number) => void;
  resetForm: () => void;

  // Execution actions
  setIsExecuting: (executing: boolean) => void;
  setCurrentBatchId: (batchId: string | null) => void;
  setLastError: (error: string | null) => void;
  setQuote: (quote: any | null) => void;
  setRiskScore: (score: number | null) => void;

  // History actions
  setUserBatches: (batches: MultiWalletBatchData[]) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  addBatchToHistory: (batch: MultiWalletBatchData) => void;

  // Async actions
  fetchUserBatches: (userAddress: string) => Promise<void>;
  getQuote: (
    asset: string,
    totalAmount: string,
    recipientCount: number
  ) => Promise<void>;
  executeBatch: (
    userAddress: string,
    params?: any
  ) => Promise<MultiWalletBatchData | null>;
}

const initialFormState = {
  asset: '',
  totalAmount: '',
  recipients: [
    { address: '', amount: '' },
    { address: '', amount: '' },
  ],
  receiverContract: '',
};

/**
 * Zustand store for multi-wallet flash loan state management
 * Handles form data, execution state, and batch history
 */
export const useFlashLoanMultiWalletStore = create<MultiWalletFlashLoanState>(
  (set, get) => ({
    // Initial state
    formData: initialFormState,
    isExecuting: false,
    currentBatchId: null,
    lastError: null,
    quote: null,
    riskScore: null,
    userBatches: [],
    isLoadingHistory: false,

    // Form actions
    setAsset: (asset: string) => {
      set(state => ({
        formData: { ...state.formData, asset },
      }));
    },

    setTotalAmount: (totalAmount: string) => {
      set(state => ({
        formData: { ...state.formData, totalAmount },
      }));
    },

    setReceiverContract: (receiverContract: string) => {
      set(state => ({
        formData: { ...state.formData, receiverContract },
      }));
    },

    addRecipient: (address: string = '', amount: string = '') => {
      set(state => {
        if (state.formData.recipients.length < 20) {
          return {
            formData: {
              ...state.formData,
              recipients: [...state.formData.recipients, { address, amount }],
            },
          };
        }
        return state;
      });
    },

    updateRecipient: (index: number, address: string, amount: string) => {
      set(state => {
        const recipients = [...state.formData.recipients];
        if (index >= 0 && index < recipients.length) {
          recipients[index] = { address, amount };
        }
        return {
          formData: { ...state.formData, recipients },
        };
      });
    },

    removeRecipient: (index: number) => {
      set(state => {
        if (state.formData.recipients.length > 1) {
          const recipients = state.formData.recipients.filter(
            (_, i) => i !== index
          );
          return {
            formData: { ...state.formData, recipients },
          };
        }
        return state;
      });
    },

    resetForm: () => {
      set({ formData: initialFormState });
    },

    // Execution actions
    setIsExecuting: (executing: boolean) => {
      set({ isExecuting: executing });
    },

    setCurrentBatchId: (batchId: string | null) => {
      set({ currentBatchId: batchId });
    },

    setLastError: (error: string | null) => {
      set({ lastError: error });
    },

    setQuote: (quote: any | null) => {
      set({ quote });
    },

    setRiskScore: (riskScore: number | null) => {
      set({ riskScore });
    },

    // History actions
    setUserBatches: (userBatches: MultiWalletBatchData[]) => {
      set({ userBatches });
    },

    setIsLoadingHistory: (isLoadingHistory: boolean) => {
      set({ isLoadingHistory });
    },

    addBatchToHistory: (batch: MultiWalletBatchData) => {
      set(state => ({
        userBatches: [batch, ...state.userBatches],
      }));
    },

    // Async actions
    fetchUserBatches: async (userAddress: string) => {
      set({ isLoadingHistory: true, lastError: null });
      try {
        const response = await fetch(
          `/api/flashloans/multi/user/${userAddress}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch user batches');
        }
        const data = await response.json();
        set({ userBatches: data.data || [] });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        set({ lastError: message });
      } finally {
        set({ isLoadingHistory: false });
      }
    },

    getQuote: async (
      asset: string,
      totalAmount: string,
      recipientCount: number
    ) => {
      set({ lastError: null });
      try {
        const response = await fetch('/api/flashloans/multi/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset,
            totalAmount: ethers.parseEther(totalAmount).toString(),
            recipientCount,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get quote');
        }

        const data = await response.json();
        set({ quote: data.data });

        // Simulate risk scoring (would be from backend AI engine in Phase 1.2)
        const mockRiskScore = Math.floor(Math.random() * 100);
        set({ riskScore: mockRiskScore });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        set({ lastError: message });
        throw error;
      }
    },

    executeBatch: async (userAddress: string, params?: any) => {
      const state = get();
      const { formData } = state;

      // Validate form
      if (!formData.asset || !formData.totalAmount || !formData.receiverContract) {
        set({ lastError: 'Please fill in all required fields' });
        return null;
      }

      if (formData.recipients.length === 0 || formData.recipients.length > 20) {
        set({ lastError: 'Recipients must be between 1 and 20' });
        return null;
      }

      set({ isExecuting: true, lastError: null });

      try {
        const response = await fetch('/api/flashloans/multi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initiator: userAddress,
            asset: formData.asset,
            totalAmount: ethers.parseEther(formData.totalAmount).toString(),
            recipients: formData.recipients.map(r => r.address),
            allocations: formData.recipients.map(r =>
              ethers.parseEther(r.amount).toString()
            ),
            receiverContract: formData.receiverContract,
            params: params || '0x',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to execute batch');
        }

        const data = await response.json();
        const batch = data.data as MultiWalletBatchData;

        set({
          currentBatchId: batch.batchId,
          quote: null,
        });

        // Add to history
        get().addBatchToHistory(batch);

        return batch;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        set({ lastError: message });
        return null;
      } finally {
        set({ isExecuting: false });
      }
    },
  })
);

export default useFlashLoanMultiWalletStore;
