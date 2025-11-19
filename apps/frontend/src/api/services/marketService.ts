import { apiClient } from '../client';

export interface CoinData {
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

export interface MarketParams {
  vs_currency?: string;
  ids?: string;
  order?: string;
  per_page?: number;
  page?: number;
  sparkline?: boolean;
  price_change_percentage?: string;
}

export class MarketService {
  static async getCoins(params: MarketParams = {}): Promise<CoinData[]> {
    const defaultParams: MarketParams = {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      sparkline: true,
      price_change_percentage: '1h,24h,7d',
      per_page: 250,
    };

    return apiClient.get<CoinData[]>('/coins/markets', {
      params: { ...defaultParams, ...params },
    });
  }

  static async getCoinById(id: string): Promise<any> {
    return apiClient.get(`/coins/${id}`);
  }

  static async getCoinPriceHistory(id: string, days: number = 7): Promise<any> {
    return apiClient.get(`/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days,
      },
    });
  }
}

