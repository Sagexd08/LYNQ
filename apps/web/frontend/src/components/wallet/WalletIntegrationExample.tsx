
import { useState, useEffect } from 'react';
import WalletConnectionModal from './WalletConnectionModal';
import WalletStatus from './WalletStatus';
import { getSavedWalletConnection, SavedWalletConnection } from './walletConfig';

const WalletIntegrationExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletInfo, setWalletInfo] = useState<SavedWalletConnection | null>(null);
  
  
  useEffect(() => {
    const savedConnection = getSavedWalletConnection();
    if (savedConnection) {
      setWalletInfo(savedConnection);
    }
  }, []);

  const handleWalletConnect = (connectionInfo: SavedWalletConnection) => {
    setWalletInfo(connectionInfo);
    console.log('Connected wallet:', connectionInfo);
  };

  const handleWalletDisconnect = () => {
    setWalletInfo(null);
    console.log('Wallet disconnected');
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Wallet Integration Demo</h1>
        
        {}
        {walletInfo ? (
          <WalletStatus onDisconnect={handleWalletDisconnect} />
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {}
      {walletInfo && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Connected Wallet Info</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Address:</span> {walletInfo.address}
            </div>
            <div>
              <span className="font-medium">Wallet:</span> {walletInfo.walletName}
            </div>
            {walletInfo.publicKey && (
              <div>
                <span className="font-medium">Public Key:</span> {walletInfo.publicKey}
              </div>
            )}
            {walletInfo.networkName && (
              <div>
                <span className="font-medium">Network:</span> {walletInfo.networkName}
              </div>
            )}
            {walletInfo.email && (
              <div>
                <span className="font-medium">Email:</span> {walletInfo.email}
              </div>
            )}
            {walletInfo.name && (
              <div>
                <span className="font-medium">Name:</span> {walletInfo.name}
              </div>
            )}
            <div>
              <span className="font-medium">Social Login:</span> {walletInfo.social ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      )}

      {}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Integration Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Import WalletConnectionModal and WalletStatus in your component</li>
          <li>Use state to track modal visibility and wallet connection status</li>
          <li>Show Connect Wallet button when not connected</li>
          <li>Show WalletStatus component when connected</li>
          <li>Handle disconnect by clearing the saved connection</li>
          <li>For complete integration with dApp, implement transaction signing</li>
        </ol>
      </div>

      {}
      <WalletConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWalletConnect={handleWalletConnect}
      />
    </div>
  );
};

export default WalletIntegrationExample;
