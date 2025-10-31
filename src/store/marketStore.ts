import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Coin {
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
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface MarketState {
  coins: Coin[];
  filteredCoins: Coin[];
  searchTerm: string;
  sortBy: 'rank' | 'volume';
  chartRange: '1h' | '24h' | '7d';
  viewMode: 'cards' | 'table';
  isLoading: boolean;
  error: string | null;
}

export interface MarketActions {
  setCoins: (coins: Coin[]) => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: 'rank' | 'volume') => void;
  setChartRange: (range: '1h' | '24h' | '7d') => void;
  setViewMode: (mode: 'cards' | 'table') => void;
  filterAndSort: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialMarketState: MarketState = {
  coins: [],
  filteredCoins: [],
  searchTerm: '',
  sortBy: 'rank',
  chartRange: '7d',
  viewMode: 'cards',
  isLoading: false,
  error: null,
};

export const useMarketStore = create<MarketState & MarketActions>()(
  devtools(
    (set, get) => ({
      ...initialMarketState,
      
      setCoins: (coins) => set(
        { coins },
        false,
        'market/setCoins'
      ),
      
      setSearchTerm: (searchTerm) => set(
        { searchTerm },
        false,
        'market/setSearchTerm'
      ),
      
      setSortBy: (sortBy) => set(
        { sortBy },
        false,
        'market/setSortBy'
      ),
      
      setChartRange: (chartRange) => set(
        { chartRange },
        false,
        'market/setChartRange'
      ),
      
      setViewMode: (viewMode) => set(
        { viewMode },
        false,
        'market/setViewMode'
      ),
      
      filterAndSort: () => {
        const { coins, searchTerm, sortBy } = get();
        let filtered = [...coins];
        
        if (searchTerm.trim()) {
          const lowercaseSearch = searchTerm.toLowerCase().trim();
          filtered = filtered.filter(
            (coin) =>
              coin.name.toLowerCase().includes(lowercaseSearch) ||
              coin.symbol.toLowerCase().includes(lowercaseSearch)
          );
        }
        
        filtered.sort((a, b) => {
          if (sortBy === 'volume') {
            return b.total_volume - a.total_volume;
          }
          return a.market_cap_rank - b.market_cap_rank;
        });
        
        set({ filteredCoins: filtered }, false, 'market/filterAndSort');
      },
      
      setLoading: (isLoading) => set(
        { isLoading },
        false,
        'market/setLoading'
      ),
      
      setError: (error) => set(
        { error },
        false,
        'market/setError'
      ),
      
      reset: () => set(initialMarketState, false, 'market/reset'),
    }),
    { name: 'MarketStore' }
  )
);

