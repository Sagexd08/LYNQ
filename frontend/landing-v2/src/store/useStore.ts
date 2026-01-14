import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SandboxTransaction, UserProgress } from '@/types';
import { Profile } from '@/lib/api/types';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chain: string | null;
  connect: () => void;
  disconnect: () => void;
}

interface AuthState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  clearAuth: () => void;
}

interface LearningState {
  progress: UserProgress;
  completeLesson: (lessonId: string, score?: number) => void;
  setCurrentLesson: (lessonId: string) => void;
  addReputation: (amount: number) => void;
}

interface SandboxState {
  balances: Record<string, number>;
  transactions: SandboxTransaction[];
  isActive: boolean;
  supply: (asset: string, amount: number) => void;
  borrow: (asset: string, amount: number) => void;
  repay: (asset: string, amount: number) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  chain: null,
  connect: () =>
    set({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      isConnected: true,
      chain: 'Mantle',
    }),
  disconnect: () => set({ address: null, isConnected: false, chain: null }),
}));

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      progress: {
        completedLessons: [],
        currentLesson: null,
        reputation: 100,
        quizScores: {},
      },
      completeLesson: (lessonId, score = 100) =>
        set((state) => ({
          progress: {
            ...state.progress,
            completedLessons: [
              ...new Set([...state.progress.completedLessons, lessonId]),
            ],
            quizScores: { ...state.progress.quizScores, [lessonId]: score },
            reputation: state.progress.reputation + 5,
          },
        })),
      setCurrentLesson: (lessonId) =>
        set((state) => ({
          progress: { ...state.progress, currentLesson: lessonId },
        })),
      addReputation: (amount) =>
        set((state) => ({
          progress: {
            ...state.progress,
            reputation: state.progress.reputation + amount,
          },
        })),
    }),
    { name: 'lynq-learning' },
  ),
);

export const useSandboxStore = create<SandboxState>((set) => ({
  balances: { USDC: 10000, ETH: 5, WBTC: 0.5 },
  transactions: [],
  isActive: false,
  supply: (asset, amount) =>
    set((state) => {
      if (state.balances[asset] < amount) return state;
      return {
        balances: {
          ...state.balances,
          [asset]: state.balances[asset] - amount,
          [`s${asset}`]: (state.balances[`s${asset}`] || 0) + amount,
        },
        transactions: [
          ...state.transactions,
          {
            id: `${Date.now()}`,
            type: 'supply',
            asset,
            amount,
            timestamp: Date.now(),
            status: 'success',
          },
        ],
      };
    }),
  borrow: (asset, amount) =>
    set((state) => ({
      balances: { ...state.balances, [asset]: state.balances[asset] + amount },
      transactions: [
        ...state.transactions,
        {
          id: `${Date.now()}`,
          type: 'borrow',
          asset,
          amount,
          timestamp: Date.now(),
          status: 'success',
        },
      ],
    })),
  repay: (asset, amount) =>
    set((state) => {
      if (state.balances[asset] < amount) return state;
      return {
        balances: { ...state.balances, [asset]: state.balances[asset] - amount },
        transactions: [
          ...state.transactions,
          {
            id: `${Date.now()}`,
            type: 'repay',
            asset,
            amount,
            timestamp: Date.now(),
            status: 'success',
          },
        ],
      };
    }),
  reset: () =>
    set({ balances: { USDC: 10000, ETH: 5, WBTC: 0.5 }, transactions: [], isActive: false }),
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearAuth: () => set({ profile: null }),
    }),
    { name: 'lynq-auth' }
  )
);
