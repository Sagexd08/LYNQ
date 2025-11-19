import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface WalletState {
  address: string;
  walletType: string;
  connectedAt: string | null;
  balance: number;
  isLoadingBalance: boolean;
  balanceError: string | null;
  chainId: string | null;
  networkName: string | null;
  publicKey?: string;
  email?: string;
  name?: string;
  social?: boolean;
}

export interface WalletActions {
  connect: (data: {
    address: string;
    walletType: string;
    chainId?: string;
    networkName?: string;
    publicKey?: string;
    email?: string;
    name?: string;
    social?: boolean;
  }) => void;
  disconnect: () => void;
  updateBalance: (balance: number) => void;
  setLoadingBalance: (loading: boolean) => void;
  setBalanceError: (error: string | null) => void;
  updateNetwork: (chainId: string, networkName: string) => void;
}

const initialWalletState: WalletState = {
  address: '',
  walletType: '',
  connectedAt: null,
  balance: 0,
  isLoadingBalance: false,
  balanceError: null,
  chainId: null,
  networkName: null,
};

export const useWalletStore = create<WalletState & WalletActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialWalletState,
        
        connect: (data) => set(
          {
            address: data.address,
            walletType: data.walletType,
            chainId: data.chainId || null,
            networkName: data.networkName || null,
            connectedAt: new Date().toISOString(),
            publicKey: data.publicKey,
            email: data.email,
            name: data.name,
            social: data.social,
            balanceError: null,
          },
          false,
          'wallet/connect'
        ),
        
        disconnect: () => set(
          {
            ...initialWalletState,
            connectedAt: null,
          },
          false,
          'wallet/disconnect'
        ),
        
        updateBalance: (balance) => set(
          { balance, isLoadingBalance: false, balanceError: null },
          false,
          'wallet/updateBalance'
        ),
        
        setLoadingBalance: (isLoadingBalance) => set(
          { isLoadingBalance },
          false,
          'wallet/setLoadingBalance'
        ),
        
        setBalanceError: (balanceError) => set(
          { balanceError, isLoadingBalance: false },
          false,
          'wallet/setBalanceError'
        ),
        
        updateNetwork: (chainId, networkName) => set(
          { chainId, networkName },
          false,
          'wallet/updateNetwork'
        ),
      }),
      {
        name: 'wallet-storage',
        partialize: (state) => ({
          address: state.address,
          walletType: state.walletType,
          connectedAt: state.connectedAt,
          chainId: state.chainId,
          networkName: state.networkName,
          publicKey: state.publicKey,
          email: state.email,
          name: state.name,
          social: state.social,
        }),
      }
    ),
    { name: 'WalletStore' }
  )
);

