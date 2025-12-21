import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Wallet,
  Menu,
  X,
  Bell,
  Settings,
  ChevronDown,
  ExternalLink,
  Copy,
  LogOut,
  User,
  Sparkles,
  Check,
  Activity,
  Shield,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useWalletStore } from '../store/walletStore';
import { clearSavedWalletConnection } from './wallet/walletConfig';

// Lazy load wallet modal
const WalletConnectionModal = React.lazy(() => import('./wallet/WalletConnectionModal'));

interface NavBarProps {
  onWalletConnect?: (walletData: any) => void;
  useTestnet?: boolean;
  onToggleNetwork?: () => void;
}

// Network options
const networks = [
  { id: 'mantle', name: 'Mantle', shortName: 'MNT', chainId: '5000', isTestnet: false, color: '#00D395' },
  { id: 'mantleSepolia', name: 'Mantle Sepolia', shortName: 'tMNT', chainId: '5003', isTestnet: true, color: '#F7931A' },
  { id: 'ethereum', name: 'Ethereum', shortName: 'ETH', chainId: '1', isTestnet: false, color: '#627EEA' },
  { id: 'sepolia', name: 'Sepolia', shortName: 'SEP', chainId: '11155111', isTestnet: true, color: '#CFB53B' },
];

const NavBar: React.FC<NavBarProps> = ({
  onWalletConnect,
  useTestnet = false,
  onToggleNetwork
}) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [networkMenuOpen, setNetworkMenuOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Get wallet state from store
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const walletType = useWalletStore((state) => state.walletType);
  const chainId = useWalletStore((state) => state.chainId);
  const disconnect = useWalletStore((state) => state.disconnect);
  const connect = useWalletStore((state) => state.connect);

  const isConnected = !!address;
  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const currentNetwork = networks.find(n => n.chainId === chainId) ||
    (useTestnet ? networks[1] : networks[0]);

  const displayBalance = `${balance.toFixed(4)} ${currentNetwork?.shortName || 'MNT'}`;

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/loans', icon: CreditCard, label: 'Loans' },
    { to: '/flashloan', icon: Zap, label: 'Flash Loans' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/marketplace', icon: Sparkles, label: 'Marketplace' },
  ];

  const notifications = [
    { id: 1, title: 'Health Factor Warning', message: 'Position at 1.3 HF', time: '5m ago', type: 'warning' },
    { id: 2, title: 'Loan Approved', message: '$5,000 USDC ready', time: '1h ago', type: 'success' },
    { id: 3, title: 'Score Updated', message: '+24 points this week', time: '2h ago', type: 'info' },
  ];

  const handleWalletConnect = (walletData: any) => {
    if (walletData?.address) {
      connect({
        address: walletData.address,
        walletType: walletData.walletType || walletData.walletName || '',
        chainId: walletData.chainId,
        networkName: walletData.networkName,
        publicKey: walletData.publicKey,
        email: walletData.email,
        name: walletData.name,
        social: walletData.social,
      });
      if (onWalletConnect) {
        onWalletConnect(walletData);
      }
    }
    setShowWalletModal(false);
  };

  const handleDisconnect = () => {
    disconnect();
    clearSavedWalletConnection();
    setProfileMenuOpen(false);
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleNetworkSwitch = (network: typeof networks[0]) => {
    if (onToggleNetwork && network.isTestnet !== useTestnet) {
      onToggleNetwork();
    }
    setNetworkMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        {/* Blur Background with gradient line */}
        <div className="absolute inset-0 bg-lynq-darker/90 backdrop-blur-2xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />

        <div className="relative max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            {/* Left Section: Logo + Navigation */}
            <div className="flex items-center gap-10">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-electric-blue via-neon-cyan to-deep-purple flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow"
                >
                  <Zap className="w-5 h-5 text-white" />
                  <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
                <div className="hidden sm:block">
                  <span className="font-heading font-bold text-xl text-white tracking-tight">LYNQ</span>
                  <div className="flex items-center gap-1.5 -mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Protocol</span>
                  </div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center">
                <div className="flex items-center bg-lynq-card/40 backdrop-blur-sm rounded-2xl p-1.5 border border-glass-border/50">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`
                          relative flex items-center gap-2 px-4 py-2 rounded-xl
                          font-medium text-sm transition-all duration-200
                          ${isActive
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                          }
                        `}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="navActiveBackground"
                            className="absolute inset-0 bg-glass-white rounded-xl border border-neon-cyan/20"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                        <link.icon className={`relative z-10 w-4 h-4 ${isActive ? 'text-neon-cyan' : ''}`} />
                        <span className="relative z-10 whitespace-nowrap">{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Section: Network + Notifications + Wallet */}
            <div className="flex items-center gap-3">
              {/* Live Status Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <Activity className="w-3.5 h-3.5 text-success animate-pulse" />
                <span className="text-xs font-medium text-success">Live</span>
              </div>

              {/* Network Selector */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setNetworkMenuOpen(!networkMenuOpen)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-lynq-card/60 hover:bg-lynq-card transition-colors border border-glass-border/50 hover:border-glass-border"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: currentNetwork?.color || '#00D395' }}
                  />
                  <span className="text-sm font-medium text-white hidden sm:inline">{currentNetwork?.name}</span>
                  <span className="text-sm font-medium text-white sm:hidden">{currentNetwork?.shortName}</span>
                  {currentNetwork?.isTestnet && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-semibold uppercase">Test</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${networkMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {networkMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-lynq-card/98 backdrop-blur-xl border border-glass-border shadow-2xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-glass-border/50">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-neon-cyan" />
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Network</span>
                        </div>
                      </div>
                      <div className="p-2">
                        {networks.map((network) => (
                          <button
                            key={network.id}
                            onClick={() => handleNetworkSwitch(network)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${currentNetwork?.id === network.id
                                ? 'bg-glass-white'
                                : 'hover:bg-glass-white/50'
                              }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: network.color }}
                            />
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-white">{network.name}</p>
                              <p className="text-xs text-gray-500">Chain ID: {network.chainId}</p>
                            </div>
                            {network.isTestnet && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-semibold">TEST</span>
                            )}
                            {currentNetwork?.id === network.id && (
                              <Check className="w-4 h-4 text-neon-cyan" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 rounded-xl bg-lynq-card/60 hover:bg-lynq-card transition-colors border border-glass-border/50 hover:border-glass-border"
                >
                  <Bell className="w-5 h-5 text-gray-300" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-error border-2 border-lynq-darker" />
                </motion.button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl bg-lynq-card/98 backdrop-blur-xl border border-glass-border shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-glass-border/50 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        <span className="text-xs text-gray-500">3 new</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-4 hover:bg-glass-white/30 transition-colors cursor-pointer border-b border-glass-border/30 last:border-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${notif.type === 'warning' ? 'bg-warning' :
                                  notif.type === 'success' ? 'bg-success' : 'bg-info'
                                }`} />
                              <div className="flex-1">
                                <p className="font-medium text-white text-sm">{notif.title}</p>
                                <p className="text-gray-400 text-xs mt-0.5">{notif.message}</p>
                                <p className="text-gray-500 text-xs mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-glass-border/50 bg-lynq-darker/50">
                        <button className="w-full text-center text-xs text-neon-cyan hover:text-white transition-colors font-medium">
                          View All Notifications
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wallet / Profile */}
              {isConnected ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl bg-gradient-to-r from-lynq-card/80 to-lynq-card/40 hover:from-lynq-card hover:to-lynq-card/60 transition-all border border-glass-border/50 hover:border-neon-cyan/30"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-electric-blue to-deep-purple flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-white">{displayAddress}</p>
                      <p className="text-xs text-gray-400">{displayBalance}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-72 rounded-2xl bg-lynq-card/98 backdrop-blur-xl border border-glass-border shadow-2xl overflow-hidden"
                      >
                        {/* Header */}
                        <div className="p-4 border-b border-glass-border/50 bg-gradient-to-r from-electric-blue/10 to-deep-purple/10">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-blue to-deep-purple flex items-center justify-center">
                              <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{displayAddress}</p>
                              <p className="text-sm text-neon-cyan font-medium">{displayBalance}</p>
                              {walletType && (
                                <p className="text-xs text-gray-500 mt-0.5">{walletType}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                          <button
                            onClick={handleCopyAddress}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-glass-white/50 transition-colors text-left group"
                          >
                            {copiedAddress ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            )}
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                              {copiedAddress ? 'Copied!' : 'Copy Address'}
                            </span>
                          </button>
                          <a
                            href={`https://explorer.mantle.xyz/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-glass-white/50 transition-colors group"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">View on Explorer</span>
                          </a>
                          <Link
                            to="/settings"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-glass-white/50 transition-colors group"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Settings</span>
                          </Link>
                        </div>

                        {/* Disconnect */}
                        <div className="p-2 border-t border-glass-border/50">
                          <button
                            onClick={handleDisconnect}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-error/10 transition-colors text-left group"
                          >
                            <LogOut className="w-4 h-4 text-error" />
                            <span className="text-sm text-error font-medium">Disconnect Wallet</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Button
                  icon={<Wallet className="w-4 h-4" />}
                  onClick={() => setShowWalletModal(true)}
                  glow
                >
                  Connect
                </Button>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-lynq-card/60 hover:bg-lynq-card transition-colors border border-glass-border/50"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[72px] z-40 lg:hidden"
          >
            <div className="bg-lynq-darker/98 backdrop-blur-xl border-b border-glass-border shadow-2xl">
              <div className="max-w-7xl mx-auto px-6 py-4">
                {/* Mobile Nav Links */}
                <div className="space-y-1 mb-4">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.to;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl
                          font-medium transition-all
                          ${isActive
                            ? 'bg-glass-white text-white border border-neon-cyan/20'
                            : 'text-gray-400 hover:text-white hover:bg-glass-white/50'
                          }
                        `}
                      >
                        <link.icon className={`w-5 h-5 ${isActive ? 'text-neon-cyan' : ''}`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile Network Selector */}
                <div className="pt-4 border-t border-glass-border/50">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-2">Network</p>
                  <div className="grid grid-cols-2 gap-2">
                    {networks.map((network) => (
                      <button
                        key={network.id}
                        onClick={() => handleNetworkSwitch(network)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${currentNetwork?.id === network.id
                            ? 'bg-glass-white text-white border border-neon-cyan/20'
                            : 'bg-glass-white/30 text-gray-400 hover:text-white'
                          }`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: network.color }}
                        />
                        <span className="truncate">{network.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdowns */}
      {(profileMenuOpen || notificationsOpen || networkMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setProfileMenuOpen(false);
            setNotificationsOpen(false);
            setNetworkMenuOpen(false);
          }}
        />
      )}

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="loading-spinner w-12 h-12" />
          </div>
        }>
          <WalletConnectionModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            onWalletConnect={handleWalletConnect}
          />
        </Suspense>
      )}
    </>
  );
};

export default NavBar;
