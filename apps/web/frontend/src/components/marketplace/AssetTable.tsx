import React from 'react';

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
  price_change_percentage_7d_in_currency?: number;
  circulating_supply: number;
  total_supply?: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface AssetTableProps {
  coins: Coin[];
  onTrade: (coin: Coin, isBuy: boolean) => void;
}

const AssetTable: React.FC<AssetTableProps> = ({ coins, onTrade }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-lg">
      <table className="min-w-full text-sm text-left text-white">
        <thead className="bg-white/5 backdrop-blur-md border-b border-white/10 text-xs uppercase font-semibold text-white/70">
          <tr>
            <th className="px-6 py-4">Asset</th>
            <th className="px-6 py-4">LTV</th>
            <th className="px-6 py-4">Deposit APR</th>
            <th className="px-6 py-4">Market Size</th>
            <th className="px-6 py-4">Borrow APR</th>
            <th className="px-6 py-4">Total Borrowed</th>
            <th className="px-6 py-4">Wallet</th>
            <th className="px-6 py-4">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/10">
          {coins.map((coin) => (
            <tr
              key={coin.id}
              className="hover:bg-white/10 transition-colors"
            >
              <td className="px-6 py-4 flex items-center gap-3">
                <img
                  src={coin.image}
                  alt={coin.name}
                  className="w-6 h-6 rounded-full"
                />
                <div>
                  <div className="font-semibold text-white">{coin.name}</div>
                  <div className="text-xs text-white/50">${coin.current_price.toLocaleString()}</div>
                </div>
              </td>

              <td className="px-6 py-4 text-white/90">80%</td>

              <td className="px-6 py-4 text-green-400 font-medium">
                {(coin.price_change_percentage_7d_in_currency ?? 0).toFixed(2)}%
              </td>

              <td className="px-6 py-4">
                <div className="text-white/90">
                  {coin.circulating_supply.toFixed(0)} {coin.symbol.toUpperCase()}
                </div>
                <div className="text-xs text-white/50">
                  ${coin.market_cap?.toLocaleString()}
                </div>
              </td>

              <td className="px-6 py-4 text-red-400 font-medium">
                {(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
              </td>

              <td className="px-6 py-4">
                <div className="text-white/90">
                  {(coin.total_volume / coin.current_price).toFixed(2)} {coin.symbol.toUpperCase()}
                </div>
                <div className="text-xs text-white/50">
                  ${coin.total_volume?.toLocaleString()}
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="text-white/90">0.00 {coin.symbol.toUpperCase()}</div>
                <div className="text-xs text-white/50">$0.00</div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onTrade(coin, true)}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg mr-2 transition"
                >
                  Buy
                </button>
                <button
                  onClick={() => onTrade(coin, false)}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition"
                >
                  Sell
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetTable;
