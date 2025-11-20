import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { LoadingFallback } from '../components/Loading';
import { COIN_LIST, API_ENDPOINTS, REQUEST_TIMEOUT } from '../constants';
import {
  LazySummaryHeader,
  LazyFilters,
  LazyCoinCard,
  LazyAssetTable,
  LazyTradeInterface,
} from '../lazyComponents';

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
  sparkline_in_7d?: { price: number[] };
}

const MarketplacePage: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [coinsError, setCoinsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'volume'>('rank');
  const [chartRange, setChartRange] = useState<'7d' | '24h' | '1h'>('7d');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showBorrowPopup, setShowBorrowPopup] = useState(false);

  const marketStats = useMemo(() => {
    const marketSize = filteredCoins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const totalBorrowed = filteredCoins.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
    return {
      marketSize,
      totalBorrowed,
      lentOut: marketSize > 0 ? ((totalBorrowed / marketSize) * 100).toFixed(2) : '0',
    };
  }, [filteredCoins]);

  const fetchCoinsData = useCallback(async () => {
    setIsLoadingCoins(true);
    setCoinsError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const { data } = await axios.get<Coin[]>(API_ENDPOINTS.COINGECKO, {
        params: {
          vs_currency: 'usd',
          ids: COIN_LIST,
          order: 'market_cap_desc',
          sparkline: true,
          price_change_percentage: '1h,24h,7d',
        },
        signal: controller.signal,
      });
      setCoins(data);
      setFilteredCoins(data);
    } catch (error) {
      setCoinsError(error instanceof Error ? error.message : 'Failed to fetch coin data');
      setCoins([]);
      setFilteredCoins([]);
    } finally {
      clearTimeout(timeout);
      setIsLoadingCoins(false);
    }
  }, []);

  useEffect(() => {
    fetchCoinsData();
  }, [fetchCoinsData]);

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
      if (sortBy === 'volume') {
        return b.total_volume - a.total_volume;
      }
      return a.market_cap_rank - b.market_cap_rank;
    });
    setFilteredCoins(filteredResult);
  }, [searchTerm, sortBy, coins]);

  const handleTrade = useCallback((coin: Coin, isBuy: boolean) => {
    alert(`${isBuy ? 'Buying' : 'Selling'} ${coin.name} (Coming soon)`);
  }, []);

  return (
    <div className="pt-10 max-w-7xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <Suspense fallback={<LoadingFallback minHeight="100px" />}>
          <LazySummaryHeader {...marketStats} />
        </Suspense>

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

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button
            onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
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

        {showBorrowPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl  shadow-2xl overflow-auto max-h-[90vh]">
              <button
                onClick={() => setShowBorrowPopup(false)}
                className="absolute top-1 right-3 text-white text-2xl hover:text-gray-400 z-50"
              >
                ✕
              </button>

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

export default MarketplacePage;
