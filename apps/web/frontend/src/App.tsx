import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import NavBar from './components/NavBar';
import HealthIndicator from './components/HealthIndicator';
import { useWalletStore } from './store/walletStore';
import { getSavedWalletConnection } from './components/wallet/walletConfig';
import { getNativeBalance, getChainByChainId, SUPPORTED_CHAINS } from './services/blockchain';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoansPage = lazy(() => import('./pages/LoansPage'));
const FlashLoanPage = lazy(() => import('./pages/FlashLoanPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const CreateLoanPage = lazy(() => import('./pages/CreateLoanPage'));
const MLInsightsPage = lazy(() => import('./pages/MLInsightsPage'));
const ProtocolPage = lazy(() => import('./pages/ProtocolPage'));
const RiskPage = lazy(() => import('./pages/RiskPage'));
const GovernancePage = lazy(() => import('./pages/GovernancePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

import { PulseBar } from './components/layout/PulseBar';

import { RiskAlertDrawer } from './components/lynq/RiskAlertDrawer';
import { DotGlobe } from './components/canvas/DotGlobe';
const LoadingFallback = () => (
  <div className="min-h-screen bg-[#050505] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-xl border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
      <p className="font-metrics text-[10px] text-gray-500 uppercase tracking-widest">Initialising Systems...</p>
    </div>
  </div>
);


const Layout = ({
  children,
  useTestnet,
  onToggleNetwork,
  onWalletConnect,

}: {
  children: React.ReactNode;
  useTestnet: boolean;
  onToggleNetwork: () => void;
  onWalletConnect: (data: any) => void;
  currentChainKey: string;
}) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {isLanding && <DotGlobe />}

      {!isLanding && (
        <NavBar
          useTestnet={useTestnet}
          onToggleNetwork={onToggleNetwork}
          onWalletConnect={onWalletConnect}
        />
      )}
      {!isLanding && (
        <div className="fixed top-[72px] left-0 right-0 z-40">
          <PulseBar />
        </div>
      )}

      <main className="relative z-10 w-full min-h-screen">
        {children}
      </main>
      {!isLanding && <RiskAlertDrawer />}
      <HealthIndicator />
    </div>
  );
};

function App() {
  const [useTestnet, setUseTestnet] = useState<boolean>(true);
  const [currentChainKey, setCurrentChainKey] = useState<string>('mantleSepolia');


  const address = useWalletStore((state) => state.address);
  const connect = useWalletStore((state) => state.connect);
  const updateBalance = useWalletStore((state) => state.updateBalance);
  const updateNetwork = useWalletStore((state) => state.updateNetwork);
  const setLoadingBalance = useWalletStore((state) => state.setLoadingBalance);
  const setBalanceError = useWalletStore((state) => state.setBalanceError);


  const fetchBalance = useCallback(async (walletAddress: string, chainKey: string = currentChainKey) => {
    if (!walletAddress) {
      updateBalance(0);
      return;
    }

    setLoadingBalance(true);

    try {
      console.log(`Fetching balance for ${walletAddress} on ${chainKey}...`);

      const { formatted, symbol } = await getNativeBalance(walletAddress, chainKey);
      const balanceNum = parseFloat(formatted);

      console.log(`Balance: ${formatted} ${symbol}`);
      updateBalance(balanceNum);
      setBalanceError(null);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalanceError('Failed to fetch balance');

      if (walletAddress.startsWith('0x1234')) {
        updateBalance(1.5);
      } else {
        updateBalance(0);
      }
    } finally {
      setLoadingBalance(false);
    }
  }, [currentChainKey, updateBalance, setLoadingBalance, setBalanceError]);


  interface WalletData {
    address: string;
    chainId?: string;
    walletType?: string;
    walletName?: string;
    networkName?: string;
    publicKey?: string;
    email?: string;
    name?: string;
    social?: string;
  }

  const handleWalletConnect = useCallback((walletData: WalletData) => {
    if (walletData?.address) {
      console.log('Wallet connected:', walletData);


      let chainKey = currentChainKey;
      if (walletData.chainId) {
        const chainInfo = getChainByChainId(walletData.chainId);
        if (chainInfo) {
          chainKey = chainInfo.key;
          setCurrentChainKey(chainInfo.key);
          setUseTestnet(chainInfo.config.isTestnet);
        }
      }

      connect({
        address: walletData.address,
        walletType: walletData.walletType || walletData.walletName || '',
        chainId: walletData.chainId || SUPPORTED_CHAINS[chainKey]?.chainId.toString(),
        networkName: walletData.networkName || SUPPORTED_CHAINS[chainKey]?.name,
        publicKey: walletData.publicKey,
        email: walletData.email,
        name: walletData.name,
        social: !!walletData.social,
      });


      fetchBalance(walletData.address, chainKey);
    }
  }, [connect, fetchBalance, currentChainKey]);


  const handleToggleNetwork = useCallback(() => {
    const newTestnetState = !useTestnet;
    setUseTestnet(newTestnetState);


    const newChainKey = newTestnetState ? 'mantleSepolia' : 'mantle';
    setCurrentChainKey(newChainKey);

    const config = SUPPORTED_CHAINS[newChainKey];
    if (config) {
      updateNetwork(config.chainId.toString(), config.name);
    }


    if (address) {
      fetchBalance(address, newChainKey);
    }
  }, [useTestnet, address, fetchBalance, updateNetwork]);


  useEffect(() => {
    const savedConnection = getSavedWalletConnection();
    if (savedConnection?.address) {
      console.log('Restoring saved wallet connection:', savedConnection);


      let chainKey = 'mantleSepolia';
      if (savedConnection.chainId) {
        const chainInfo = getChainByChainId(savedConnection.chainId);
        if (chainInfo) {
          chainKey = chainInfo.key;
          setCurrentChainKey(chainInfo.key);
          setUseTestnet(chainInfo.config.isTestnet);
        }
      }

      connect({
        address: savedConnection.address,
        walletType: savedConnection.walletType || '',
        chainId: savedConnection.chainId,
        networkName: savedConnection.networkName,
      });

      fetchBalance(savedConnection.address, chainKey);
    }
  }, [connect, fetchBalance]);


  useEffect(() => {
    if (!address) return;


    const interval = setInterval(() => {
      fetchBalance(address, currentChainKey);
    }, 30000);

    return () => clearInterval(interval);
  }, [address, currentChainKey, fetchBalance]);

  return (
    <ErrorBoundary>
      <Layout
        useTestnet={useTestnet}
        onToggleNetwork={handleToggleNetwork}
        onWalletConnect={handleWalletConnect}
        currentChainKey={currentChainKey}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/loans/new" element={<CreateLoanPage />} />
            <Route path="/loans/*" element={<LoansPage />} />
            <Route path="/flashloan/*" element={<FlashLoanPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/ml-insights" element={<MLInsightsPage />} />
            <Route path="/protocol" element={<ProtocolPage />} />
            <Route path="/risk" element={<RiskPage />} />
            <Route path="/governance" element={<GovernancePage />} />
            <Route path="/analytics" element={<MLInsightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
