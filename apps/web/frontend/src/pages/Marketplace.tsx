import React, { Suspense } from 'react';
import { LoadingFallback } from '../components/Loading';
import {
  LazySummaryHeader,
  LazyFilters,
  LazyCoinCard,
  LazyAssetTable,
  LazyTradeInterface,
} from '../lazyComponents';

interface MarketplaceProps {
  marketStats: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  chartRange: string;
  setChartRange: (range: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  showBorrowPopup: boolean;
  setShowBorrowPopup: (show: boolean) => void;
  isLoadingCoins: boolean;
  coinsError: string | null;
  filteredCoins: any[];
  handleTrade: (coin: any, isBuy: boolean) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({
  marketStats,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  chartRange,
  setChartRange,
  viewMode,
  setViewMode,
  showBorrowPopup,
  setShowBorrowPopup,
  isLoadingCoins,
  coinsError,
  filteredCoins,
  handleTrade,
}) => {
  return (
    <div className="pt-10 max-w-7xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Market Summary */}
        <Suspense fallback={<LoadingFallback minHeight="100px" />}>
          <LazySummaryHeader {...marketStats} />
        </Suspense>

        {/* Filters & Controls */}
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

        {/* View Toggle & Borrow Button */}
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

        {/* Coins Grid / Table */}
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

        {/* Borrow Popup */}
        {showBorrowPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl  shadow-2xl overflow-auto max-h-[90vh]">
              {/* Close Button */}
              <button
                onClick={() => setShowBorrowPopup(false)}
                className="absolute top-1 right-3 text-white text-2xl hover:text-gray-400 z-50"
              >
                ✕
              </button>

              {/* Trade Interface */}
              <Suspense fallback={<LoadingFallback minHeight="150px" />}>
                <LazyTradeInterface />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
