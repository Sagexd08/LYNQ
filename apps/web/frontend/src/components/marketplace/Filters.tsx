import React from 'react';

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  chartRange: string;
  setChartRange: (range: string) => void;
}

const Filters: React.FC<FiltersProps> = ({ searchTerm, setSearchTerm, sortBy, setSortBy, chartRange, setChartRange }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {}
      <input
        type="text"
        placeholder="Search Coin"
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        className=" px-4 py-2 rounded-lg bg-white/5 text-white placeholder-white/50 border border-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      {}
      <select
        value={sortBy}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
        className="px-4 py-2 rounded-lg bg-white/5 text-white border border-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
      >
        <option value="rank" className='text-black'>Sort by Rank</option>
        <option value="volume" className='text-black'>Sort by Volume</option>
      </select>

      {}
      <select
        value={chartRange}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChartRange(e.target.value)}
        className=" px-4 py-2 rounded-lg bg-white/5 text-white border border-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
      >
        <option value="1d" className='text-black'>1 Day</option>
        <option value="7d" className='text-black'>7 Days</option>
        <option value="30d" className='text-black'>30 Days</option>
      </select>
    </div>
  );
}

export default Filters;
