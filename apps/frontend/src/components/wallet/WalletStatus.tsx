
import { useState, useEffect } from 'react';
import {
  getSavedWalletConnection,
  clearSavedWalletConnection,
  SavedWalletConnection
} from './walletConfig';
import { WALLET_LOGOS } from '../../assets/wallets/walletLogos';

interface WalletStatusProps {
  onDisconnect?: () => void;
}

const WalletStatus: React.FC<WalletStatusProps> = ({ onDisconnect = () => {} }) => {
  const [walletInfo, setWalletInfo] = useState<SavedWalletConnection | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    
    const savedConnection = getSavedWalletConnection();
    if (savedConnection) {
      setWalletInfo(savedConnection);
    }
    
    
    const handleStorageChange = () => {
      const connection = getSavedWalletConnection();
      setWalletInfo(connection);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDisconnect = () => {
    clearSavedWalletConnection();
    setWalletInfo(null);
    onDisconnect();
    setIsMenuOpen(false);
  };

  if (!walletInfo) {
    return null; 
  }

  
  const shortAddress = walletInfo.address.length > 10
    ? `${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}`
    : walletInfo.address;

  
  const logo = walletInfo.walletName ? WALLET_LOGOS[walletInfo.walletName] : undefined;

  const handleCopy = () => {
    navigator.clipboard.writeText(walletInfo.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="relative">
      {}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors ${isMenuOpen ? 'ring-2 ring-blue-400' : ''}`}
      >
        {logo ? (
          <img src={logo} alt={walletInfo.walletName} className="w-8 h-8 rounded-full shadow-md border border-gray-200 bg-white" />
        ) : (
          <span className="text-lg">👛</span>
        )}
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {walletInfo.walletName}
        </span>
        <span className="text-xs text-gray-500 font-mono">{shortAddress}</span>
        <svg
          className={`w-4 h-4 text-blue-700 dark:text-blue-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 animate-fade-in-down">
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              {logo ? (
                <img src={logo} alt={walletInfo.walletName} className="w-12 h-12 rounded-full shadow border border-gray-200 bg-white" />
              ) : (
                <span className="text-2xl">👛</span>
              )}
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-lg">
                  {walletInfo.walletName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1">
                  {shortAddress}
                  <button
                    onClick={handleCopy}
                    className="ml-1 px-1 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
                    title="Copy address"
                  >
                    📋
                  </button>
                  {copied && <span className="text-green-500 ml-1">Copied!</span>}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition font-semibold"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletStatus;
