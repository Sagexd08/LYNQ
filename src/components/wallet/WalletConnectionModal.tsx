// src/components/wallet/WalletConnectionModal.tsx
import { useState } from 'react';
import {
  walletProviders,
  useWalletDetection,
  connectToWallet,
  saveWalletConnection,
  SavedWalletConnection,
  WalletProvider,
  WalletResponse
} from './walletConfig';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnect: (connectionInfo: SavedWalletConnection) => void;
  isLandingPage?: boolean;
}

const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onWalletConnect, 
  isLandingPage = false 
}) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the wallet detection hook from walletConfig
  const { detectedWallets, isDetecting } = useWalletDetection();

  // Debug: Log detected wallets
  console.log('Detected wallets:', detectedWallets);

  // Universal wallet connection handler for crypto wallets
  const handleWalletConnect = async (wallet: WalletProvider) => {
    console.log('Attempting to connect to wallet:', wallet.name);
    setIsConnecting(true);
    setSelectedWallet(wallet.id);
    setError(null);

    try {
      // Use the connectToWallet function from walletConfig.js
      const connectionResult: WalletResponse = await connectToWallet(wallet.id);
      console.log('Connection successful:', connectionResult);
      
      // Create SavedWalletConnection object with required fields
      const savedConnection: SavedWalletConnection = {
        ...connectionResult,
        walletType: wallet.name,
        connectedAt: new Date().toISOString()
      };
      
      // Save connection to localStorage for persistence
      saveWalletConnection(savedConnection);
      
      // Call the parent component's callback with connection info
      onWalletConnect(savedConnection);
      
      onClose();
    } catch (error: unknown) {
      console.error(`${wallet.name} connection error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to connect with ${wallet.name}: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  // Add test/demo wallet connection for development
  const handleTestWalletConnect = () => {
    console.log('Connecting to test wallet...');
    const testWalletData: SavedWalletConnection = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      walletName: 'Test Wallet',
      connected: true,
      walletType: 'Test',
      connectedAt: new Date().toISOString()
    };
    
    // Save test connection
    saveWalletConnection(testWalletData);
    
    // Call parent callback
    onWalletConnect(testWalletData);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[60] px-4" style={{ paddingTop: isLandingPage ? '120px' : '100px' }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[calc(100vh-140px)] overflow-y-auto shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Select Wallet
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AIP-62 Standard Notice */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-green-700 dark:text-green-300 text-center">
            Powered by AIP-62 Wallet Standard
          </p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-red-700 dark:text-red-300 text-center">
              {error}
            </p>
          </div>
        )}

        {/* Wallet Options */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Crypto Wallets
          </h3>
          <div className="space-y-2">
            {walletProviders.map((wallet) => {
              const isDetected = detectedWallets[wallet.id];
              const isCurrentlyConnecting = isConnecting && selectedWallet === wallet.id;

              return (
                <button
                  key={wallet.id}
                  onClick={() => isDetected ? handleWalletConnect(wallet) : window.open(wallet.downloadUrl, '_blank')}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {wallet.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isCurrentlyConnecting ? 'Connecting...' : 
                       isDetecting ? 'Detecting...' :
                       isDetected ? 'Installed' : 'Not Detected'}
                    </div>
                  </div>
                  {(isCurrentlyConnecting || (isDetecting && !isCurrentlyConnecting)) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                  )}
                  {!isDetected && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">Install</span>
                  )}
                </button>
              );
            })}
            
            {/* Test Wallet for Development */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                For Testing
              </h4>
              <button
                onClick={handleTestWalletConnect}
                disabled={isConnecting}
                className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors disabled:opacity-50 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              >
                <span className="text-2xl">🧪</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Test Wallet
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Demo connection (for testing)
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Network Reminder */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <div className="text-blue-500 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>REMIND</strong><br />
              Please switch your wallet to <span className="font-semibold">CORRECT NETWORK</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectionModal;
