import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { TrendingUp, BarChart2, Coins, CircleDollarSign, Package } from 'lucide-react';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

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
  total_supply?: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface CoinCardProps {
  coin: Coin;
  chartRange: string;
  onTrade: (coin: Coin, isBuy: boolean) => void;
}

const CoinCard: React.FC<CoinCardProps> = ({ coin, onTrade }) => {
  return (
    <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all space-y-3">
      {}
      <div className="flex items-center gap-4">
        <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full border border-white/20" />
        <div>
          <h2 className="text-xl font-bold text-white">{coin.name}</h2>
          <p className="text-xs uppercase text-white/50">{coin.symbol}</p>
        </div>
      </div>

      {}
      <div className="text-sm text-white/80 space-y-1">
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <CircleDollarSign className="w-4 h-4" /> Price:
          </span>
          <span className="font-semibold text-white">${coin.current_price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> 24h Change:
          </span>
          <span
            className={`font-semibold ${
              coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {coin.price_change_percentage_24h?.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <BarChart2 className="w-4 h-4" /> Market Cap:
          </span>
          <span className="font-semibold text-white">${coin.market_cap.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Coins className="w-4 h-4" /> Volume:
          </span>
          <span className="font-semibold text-white">${coin.total_volume.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Package className="w-4 h-4" /> Circulating:
          </span>
          <span className="font-semibold text-white">{coin.circulating_supply.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Package className="w-4 h-4 opacity-60" /> Total Supply:
          </span>
          <span className="font-semibold text-white">
            {coin.total_supply?.toLocaleString() || 'N/A'}
          </span>
        </div>
      </div>

      {}
      <div className="h-24 mt-1">
        <Line
          data={{
            labels: Array(coin.sparkline_in_7d?.price?.length || 0).fill(''),
            datasets: [
              {
                data: coin.sparkline_in_7d?.price || [],
                borderColor: '#4F46E5',
                borderWidth: 2,
                pointRadius: 0,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
          }}
        />
      </div>

      {}
      <div className="flex justify-between pt-2">
        <button
          onClick={() => onTrade(coin, true)}
          className="px-4 py-1.5 text-sm bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
        >
          Buy
        </button>
        <button
          onClick={() => onTrade(coin, false)}
          className="px-4 py-1.5 text-sm bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
        >
          Sell
        </button>
      </div>
    </div>
  );
}

export default CoinCard;
