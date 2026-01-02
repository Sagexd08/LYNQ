import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  walletProviders,
  useWalletDetection,
  connectToWallet,
  saveWalletConnection,
  SavedWalletConnection,
  WalletProvider,
  WalletResponse
} from './walletConfig';
import { X, ExternalLink, Zap, Shield, Wallet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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

  const { detectedWallets, isDetecting } = useWalletDetection();

  const handleWalletConnect = async (wallet: WalletProvider) => {
    setIsConnecting(true);
    setSelectedWallet(wallet.id);
    setError(null);

    try {
      const connectionResult: WalletResponse = await connectToWallet(wallet.id);

      const savedConnection: SavedWalletConnection = {
        ...connectionResult,
        walletType: wallet.name,
        connectedAt: new Date().toISOString()
      };

      saveWalletConnection(savedConnection);
      onWalletConnect(savedConnection);
      onClose();
    } catch (error: unknown) {
      console.error(`${wallet.name} connection error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to connect: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  const handleTestWalletConnect = () => {
    const testWalletData: SavedWalletConnection = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      walletName: 'Test Wallet',
      connected: true,
      walletType: 'Test',
      connectedAt: new Date().toISOString()
    };

    saveWalletConnection(testWalletData);
    onWalletConnect(testWalletData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ paddingTop: isLandingPage ? '80px' : '60px' }}
          >
            <div className="relative w-full max-w-md">
              {}
              <div className="absolute -inset-1 bg-gradient-to-r from-electric-blue via-neon-cyan to-deep-purple rounded-3xl blur-xl opacity-30" />

              {}
              <div className="relative bg-lynq-card/95 backdrop-blur-2xl rounded-2xl border border-glass-border shadow-2xl overflow-hidden">
                {}
                <div className="relative px-6 py-5 border-b border-glass-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-electric-blue to-neon-cyan">
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
                        <p className="text-xs text-gray-400">Choose your preferred wallet</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-glass-white transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {}
                <div className="px-6 py-3 bg-neon-cyan/5 border-b border-glass-border/30">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-neon-cyan" />
                    <span className="text-xs font-medium text-neon-cyan">
                      Secured by AIP-62 Wallet Standard
                    </span>
                  </div>
                </div>

                {}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-3 bg-error/10 border-b border-error/20">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-error" />
                          <span className="text-sm text-error">{error}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {}
                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {}
                  {walletProviders.map((wallet) => {
                    const isDetected = detectedWallets[wallet.id];
                    const isCurrentlyConnecting = isConnecting && selectedWallet === wallet.id;

                    return (
                      <motion.button
                        key={wallet.id}
                        onClick={() => isDetected ? handleWalletConnect(wallet) : window.open(wallet.downloadUrl, '_blank')}
                        disabled={isConnecting}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`
                          w-full flex items-center gap-4 p-4 rounded-xl
                          border transition-all duration-200
                          ${isDetected
                            ? 'bg-glass-white/50 border-glass-border hover:border-neon-cyan/30 hover:bg-glass-white'
                            : 'bg-lynq-darker/50 border-glass-border/50 opacity-60 hover:opacity-80'
                          }
                          ${isCurrentlyConnecting ? 'border-neon-cyan/50' : ''}
                          disabled:cursor-not-allowed
                        `}
                      >
                        {}
                        <div className="w-12 h-12 rounded-xl bg-lynq-darker flex items-center justify-center text-3xl">
                          {wallet.icon}
                        </div>

                        {}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{wallet.name}</span>
                            {isDetected && (
                              <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-semibold uppercase">
                                Detected
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 mt-0.5">
                            {isCurrentlyConnecting ? 'Connecting...' :
                              isDetecting ? 'Checking...' :
                                isDetected ? 'Ready to connect' : 'Not installed'}
                          </div>
                        </div>

                        {}
                        {isCurrentlyConnecting ? (
                          <Loader2 className="w-5 h-5 text-neon-cyan animate-spin" />
                        ) : isDetecting ? (
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : isDetected ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        )}
                      </motion.button>
                    );
                  })}

                  {}
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-glass-border/50" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">For Testing</span>
                    <div className="flex-1 h-px bg-glass-border/50" />
                  </div>

                  {}
                  <motion.button
                    onClick={handleTestWalletConnect}
                    disabled={isConnecting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-success/10 to-neon-cyan/10 border border-success/30 hover:border-success/50 transition-all disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center text-3xl">
                      🧪
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-white">Demo Wallet</span>
                      <div className="text-sm text-gray-400 mt-0.5">
                        Test the app without a real wallet
                      </div>
                    </div>
                    <Zap className="w-5 h-5 text-success" />
                  </motion.button>
                </div>

                {}
                <div className="px-6 py-4 bg-lynq-darker/50 border-t border-glass-border/50">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-electric-blue/10">
                      <Zap className="w-4 h-4 text-electric-blue" />
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      <span className="text-white font-medium">New to Web3?</span>{' '}
                      We recommend MetaMask or Petra for the best experience.
                      Make sure you're on the correct network.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WalletConnectionModal;
