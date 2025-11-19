import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Page = 'landing' | 'dashboard' | 'marketplace' | 'cards';

export interface UIState {
  currentPage: Page;
  showWalletModal: boolean;
  showBorrowPopup: boolean;
  useTestnet: boolean;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

export interface UIActions {
  setCurrentPage: (page: Page) => void;
  toggleWalletModal: () => void;
  setShowBorrowPopup: (show: boolean) => void;
  toggleNetwork: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  reset: () => void;
}

const initialUIState: UIState = {
  currentPage: 'landing',
  showWalletModal: false,
  showBorrowPopup: false,
  useTestnet: false,
  theme: 'dark',
  sidebarOpen: false,
};

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialUIState,
        
        setCurrentPage: (currentPage) => set(
          { currentPage },
          false,
          'ui/setCurrentPage'
        ),
        
        toggleWalletModal: () => set(
          (state) => ({ showWalletModal: !state.showWalletModal }),
          false,
          'ui/toggleWalletModal'
        ),
        
        setShowBorrowPopup: (showBorrowPopup) => set(
          { showBorrowPopup },
          false,
          'ui/setShowBorrowPopup'
        ),
        
        toggleNetwork: () => set(
          (state) => ({ useTestnet: !state.useTestnet }),
          false,
          'ui/toggleNetwork'
        ),
        
        setTheme: (theme) => set(
          { theme },
          false,
          'ui/setTheme'
        ),
        
        toggleSidebar: () => set(
          (state) => ({ sidebarOpen: !state.sidebarOpen }),
          false,
          'ui/toggleSidebar'
        ),
        
        reset: () => set(initialUIState, false, 'ui/reset'),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          currentPage: state.currentPage,
          useTestnet: state.useTestnet,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

