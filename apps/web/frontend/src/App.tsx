import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import ErrorBoundary from "./components/ErrorBoundary";
import NavBar from "./components/NavBar";
import LandingNavbar from "./components/landing/Navbar";
import HeroSection from "./components/landing/HeroSection";
import Features from "./components/landing/Features";
import CTASection from "./components/landing/CTASection";
import Reputation from "./components/landing/Reputation";
import Footer from "./components/landing/Footer";
import BuiltOnEthereum from "./components/landing/BuiltOnEthereum";
import { COIN_LIST, API_ENDPOINTS, REQUEST_TIMEOUT } from "./constants";
import HealthIndicator from "./components/HealthIndicator";
import { useWalletStore } from "./store/walletStore";

import {
  LazyProfileDashboard,
  LazyPersonalDetails,
  LazyTransaction,
  LazyFilters,
  LazyCoinCard,
  LazyAssetTable,
  LazySummaryHeader,
  LazyTradeInterface,
  LazySmallLoanCard,
  LazyBigLoanCard,
  LazyLoanRequestForm,
  LazyLoanEligibilityMeter,
  LazyWalletConnectionModal,
  LazyFaucetModule,
} from "./lazyComponents";

const LazyFlashLoanDashboard = lazy(() => import("./components/flashloan/FlashLoanDashboard"));

import {
  getSavedWalletConnection,
  clearSavedWalletConnection,
} from "./components/wallet/walletConfig";


interface SparklineData {
  price: number[];
}

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply?: number | null;
  sparkline_in_7d?: SparklineData;
}

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const [currentPage, setCurrentPage] = useState<
    "landing" | "dashboard" | "marketplace" | "cards" | "flashloan"
  >(isLanding ? "landing" : "marketplace");

  // Get wallet data from store
  const address = useWalletStore((state) => state.address);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const updateBalance = useWalletStore((state) => state.updateBalance);
  const setLoadingBalance = useWalletStore((state) => state.setLoadingBalance);
  const setBalanceError = useWalletStore((state) => state.setBalanceError);
  const ethBalance = useWalletStore((state) => state.balance);
  const isLoadingBalance = useWalletStore((state) => state.isLoadingBalance);
  const balanceError = useWalletStore((state) => state.balanceError);

  const [useTestnet, setUseTestnet] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);

  
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState<boolean>(false);
  const [coinsError, setCoinsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rank" | "volume">("rank");
  const [chartRange, setChartRange] = useState<"7d" | "24h" | "1h">("7d");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  
  const [showBorrowPopup, setShowBorrowPopup] = useState<boolean>(false);

  
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    return { controller, timeout };
  }, []);

  const handleApiError = useCallback((error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return "An unknown error occurred";
  }, []);

  
  const fetchEthBalance = useCallback(
    async (address: string): Promise<void> => {
      if (!address) {
        updateBalance(0);
        return;
      }

      setLoadingBalance(true);
      setBalanceError(null);

      const { timeout } = createAbortController();

      try {
        
        
        updateBalance(1.5); 
      } catch (error) {
        const errorMessage = handleApiError(error);
        setBalanceError(errorMessage);
        updateBalance(0);
      } finally {
        clearTimeout(timeout);
        setLoadingBalance(false);
      }
    },
    [useTestnet, createAbortController, handleApiError, updateBalance, setLoadingBalance, setBalanceError]
  );

  
  const fetchCoinsData = useCallback(async (): Promise<void> => {
    setIsLoadingCoins(true);
    setCoinsError(null);

    const { controller, timeout } = createAbortController();

    try {
      const { data }: { data: Coin[] } = await axios.get(API_ENDPOINTS.COINGECKO, {
        params: {
          vs_currency: "usd",
          ids: COIN_LIST,
          order: "market_cap_desc",
          sparkline: true,
          price_change_percentage: "1h,24h,7d",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      setCoins(data);
      setFilteredCoins(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setCoinsError(errorMessage);
      setCoins([]);
      setFilteredCoins([]);
    } finally {
      clearTimeout(timeout);
      setIsLoadingCoins(false);
    }
  }, [createAbortController, handleApiError]);

  
  const handleWalletConnect = useCallback(
    (walletData: any): void => {
      if (walletData?.address) {
        connect({
          address: walletData.address,
          walletType: walletData.walletType || "",
          chainId: walletData.chainId,
          networkName: walletData.networkName,
          publicKey: walletData.publicKey,
          email: walletData.email,
          name: walletData.name,
          social: walletData.social,
        });
        fetchEthBalance(walletData.address);
      } else {
        handleWalletDisconnect();
      }
      setShowWalletModal(false);
    },
    [connect, fetchEthBalance]
  );

  const handleWalletDisconnect = useCallback((): void => {
    disconnect();
    clearSavedWalletConnection();
  }, [disconnect]);

  const handleToggleNetwork = useCallback((): void => {
    setUseTestnet((prev) => !prev);
    if (address) {
      fetchEthBalance(address);
    }
  }, [address, fetchEthBalance]);

  const handleTrade = useCallback((coin: Coin, isBuy: boolean): void => {
    alert(`${isBuy ? "Buying" : "Selling"} ${coin.name} (Coming soon)`);
  }, []);

  
  useEffect(() => {
    const savedConnection = getSavedWalletConnection();
    if (savedConnection?.address) {
      connect({
        address: savedConnection.address,
        walletType: savedConnection.walletType || "",
        chainId: savedConnection.chainId,
        networkName: savedConnection.networkName,
      });
      fetchEthBalance(savedConnection.address);
    }
  }, [connect, fetchEthBalance]);

  useEffect(() => {
    const dataRequiredPages = ["marketplace", "dashboard", "cards"];
    if (dataRequiredPages.includes(currentPage)) {
      fetchCoinsData();
    }
  }, [currentPage, fetchCoinsData]);

  useEffect(() => {
    let filteredResult = [...coins];
    
    
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase().trim();
      filteredResult = filteredResult.filter(
        (coin) =>
          coin.name.toLowerCase().includes(lowercaseSearch) ||
          coin.symbol.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    
    filteredResult.sort((a, b) => {
      if (sortBy === "volume") {
        return b.total_volume - a.total_volume;
      }
      return a.market_cap_rank - b.market_cap_rank;
    });
    
    setFilteredCoins(filteredResult);
  }, [searchTerm, sortBy, coins]);

  
  const walletData = useMemo(
    () => ({
      address,
      ethBalance,
      isLoadingBalance,
      balanceError,
    }),
    [address, ethBalance, isLoadingBalance, balanceError]
  );

  const marketStats = useMemo(() => {
    const marketSize = filteredCoins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const totalBorrowed = filteredCoins.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
    
    return {
      marketSize,
      totalBorrowed,
      lentOut: marketSize > 0 ? ((totalBorrowed / marketSize) * 100).toFixed(2) : "0",
    };
  }, [filteredCoins]);

  
  const sampleLoans = useMemo(() => ({
    bigLoan: {
      id: "001",
      amount: "$5,000",
      interestRate: "8.5%",
      term: "12 months",
      monthlyPayment: "$456",
      nextPayment: "Jul 15, 2025",
      remainingBalance: "$4,200",
      status: "Active",
    },
    smallLoans: [
      {
        id: 2,
        amount: "$500",
        interest: "4%",
        dueDate: "Aug 20, 2025",
        status: "Active",
      },
      {
        id: 3,
        amount: "$1,000",
        interest: "3%",
        dueDate: "June 25, 2025",
        status: "Pending",
      },
      {
        id: 4,
        amount: "$750",
        interest: "5%",
        dueDate: "Sep 10, 2025",
        status: "Pending",
      },
      {
        id: 5,
        amount: "$300",
        interest: "2%",
        dueDate: "Oct 5, 2025",
        status: "Active",
      },
    ],
  }), []);

  
  const LoadingSpinner = useMemo(() => ({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) => {
    const sizeClasses = {
      sm: "h-5 w-5",
      md: "h-6 w-6", 
      lg: "h-8 w-8"
    };
    
    return (
      <div className={`animate-spin rounded-full border-b-2 border-white ${sizeClasses[size]} ${className}`} />
    );
  }, []);

  const LoadingFallback = useMemo(() => ({ minHeight = "150px", size = "md" }: { minHeight?: string; size?: "sm" | "md" | "lg" }) => (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <LoadingSpinner size={size} />
    </div>
  ), [LoadingSpinner]);

  
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <div className="min-h-screen w-full text-white">
            <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white/5 border border-white/10 rounded-lg p-6 shadow-lg mt-20">
                <div className="lg:col-span-2 space-y-6">
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback minHeight="300px" />}>
                      <LazyProfileDashboard 
                        ethBalance={ethBalance}
                      />
                    </Suspense>
                  </ErrorBoundary>
                  <Suspense fallback={<LoadingFallback minHeight="200px" />}>
                    <LazyPersonalDetails {...walletData} />
                  </Suspense>
                </div>
                {}
                <Suspense fallback={<LoadingFallback minHeight="200px" />}>
                  <LazyTransaction />
                </Suspense>
              </div>
            </div>
          </div>
        );
      case "marketplace":
        return (
          <div className="pt-10 max-w-7xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {}
              <Suspense fallback={<LoadingFallback minHeight="100px" />}>
                <LazySummaryHeader {...marketStats} />
              </Suspense>

              {}
              <div>
                <Suspense fallback={<LoadingFallback minHeight="80px" size="sm" />}>
                  <LazyFilters
                    {...{
                      searchTerm,
                      setSearchTerm,
                      sortBy,
                      setSortBy,
                      chartRange,
                      setChartRange,
                    }}
                  />
                </Suspense>
              </div>

              {}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <button
                  onClick={() =>
                    setViewMode(viewMode === "cards" ? "table" : "cards")
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 transition px-4 py-2 rounded text-white"
                >
                  Toggle View: {viewMode === "cards" ? "Table" : "Cards"}
                </button>
                <button
                  onClick={() => setShowBorrowPopup(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 transition px-4 py-2 rounded text-white"
                >
                  Open Borrowing
                </button>
              </div>

              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingCoins ? (
                  <div className="col-span-full text-center py-10 text-lg text-gray-400">
                    Loading coins...
                  </div>
                ) : coinsError ? (
                  <div className="col-span-full text-center text-red-500">
                    {coinsError}
                  </div>
                ) : viewMode === "cards" ? (
                  <Suspense fallback={<LoadingFallback minHeight="200px" />}>
                    {filteredCoins.map((coin) => (
                      <LazyCoinCard
                        key={coin.id}
                        coin={coin}
                        chartRange={chartRange}
                        onTrade={handleTrade}
                      />
                    ))}
                  </Suspense>
                ) : (
                  <div className="col-span-full">
                    <Suspense fallback={<LoadingFallback minHeight="200px" />}>
                      <LazyAssetTable coins={filteredCoins} onTrade={handleTrade} />
                    </Suspense>
                  </div>
                )}
              </div>

              {}
              {showBorrowPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="relative w-full max-w-6xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl  shadow-2xl overflow-auto max-h-[90vh]">
                    {}
                    <button
                      onClick={() => setShowBorrowPopup(false)}
                      className="absolute top-1 right-3 text-white text-2xl hover:text-gray-400 z-50"
                    >
                      ✕
                    </button>

                    {}
                    <Suspense fallback={<LoadingFallback minHeight="150px" />}>
                      <LazyTradeInterface />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "cards":
        return (
          <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto text-white space-y-12">
            <div className="text-center space-y-2 mt-20">
              <h1 className="p-2 text-3xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-400 via-blue-400 to-teal-300 bg-clip-text text-transparent drop-shadow-md opacity-90">
                Loan Management
              </h1>
              <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
                Manage your active loans, request new ones, and track your
                eligibility.
              </p>
            </div>
            <div className="flex gap-10 w-screen">
              <div className="w-3/6 flex flex-col gap-10 border border-white/10 py-10 px-4 rounded-2xl">
                <Suspense fallback={<LoadingFallback minHeight="150px" />}>
                  <LazyLoanRequestForm />
                </Suspense>
                <div className="border w-full border-white/50"></div>
                <Suspense fallback={<LoadingFallback minHeight="200px" />}>
                  <LazyBigLoanCard loan={sampleLoans.bigLoan} />
                </Suspense>
                <div className="border w-full border-white/50"></div>
                <div className="grid grid-cols-2 gap-2">
                  <Suspense fallback={<LoadingFallback minHeight="100px" size="sm" />}>
                    {sampleLoans.smallLoans.map((loan) => (
                      <LazySmallLoanCard key={loan.id} loan={loan} />
                    ))}
                  </Suspense>
                </div>
              </div>
              <div className="w-2/6">
                <Suspense fallback={<LoadingFallback minHeight="150px" />}>
                  <LazyLoanEligibilityMeter score={75} />
                </Suspense>
              </div>
            </div>
          </section>
        );
      case "flashloan":
        return (
          <div className="min-h-screen w-full text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback minHeight="300px" />}>
                  <LazyFlashLoanDashboard />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-black text-white font-sans relative">
            <main className="overflow-x-hidden">
              <HeroSection
                onGetStarted={() => setCurrentPage("marketplace")}
              />
              <div className="bg-grid">
                <Features />
                <Reputation />
                <Suspense fallback={<LoadingFallback minHeight="150px" />}>
                  <LazyFaucetModule />
                </Suspense>
                <Suspense fallback={<LoadingFallback minHeight="150px" />}>
                  <BuiltOnEthereum />
                </Suspense>
                <CTASection
                  onGetStarted={() => setCurrentPage("marketplace")}
                />
              </div>
            </main>
            <Footer />
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen ${
          ["landing", "cards", "dashboard", "marketplace", "flashloan"].includes(currentPage)
            ? "bg-black text-white"
            : ""
        }`}
      >
        <div className="relative z-20">
          {currentPage === "landing" ? (
            <LandingNavbar
              onShowWalletModal={() => setShowWalletModal(true)}
            />
          ) : (
            <NavBar
              onWalletConnect={handleWalletConnect}
              onShowWalletModal={() => setShowWalletModal(true)}
              useTestnet={useTestnet}
              onToggleNetwork={handleToggleNetwork}
            />
          )}
        </div>
        <main className="relative z-10">{renderPage()}</main>
        {showWalletModal && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <LazyWalletConnectionModal
              isOpen={showWalletModal}
              onClose={() => setShowWalletModal(false)}
              onWalletConnect={handleWalletConnect}
              isLandingPage={currentPage === "landing"}
            />
          </Suspense>
        )}
        <HealthIndicator />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return <AppContent />;
}

export default App;
