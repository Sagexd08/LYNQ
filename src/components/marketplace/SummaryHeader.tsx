import React from "react";

interface SummaryHeaderProps {
  marketSize: number;
  totalBorrowed: number;
  lentOut: string;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ marketSize, totalBorrowed, lentOut }) => {
  return (
    <div className="flex flex-col gap-6 mb-10 w-full max-w-7xl mx-auto px-4 sm:px-6 mt-20">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {[
          {
            label: "Current Market Size",
            value: `$${marketSize.toLocaleString()}`,
            color: "text-green-400",
            hover: "hover:shadow-green-500/20",
            glow: "shadow-[inset_0_0_16px_0_rgba(16,185,129,0.3)]",
          },
          {
            label: "Total Borrowed",
            value: `$${totalBorrowed.toLocaleString()}`,
            color: "text-red-400",
            hover: "hover:shadow-red-500/20",
            glow: "shadow-[inset_0_0_16px_0_rgba(239,68,68,0.3)]",
          },
          {
            label: "Lent Out",
            value: `${lentOut}%`,
            color: "text-blue-400",
            hover: "hover:shadow-blue-500/20",
            glow: "shadow-[inset_0_0_16px_0_rgba(59,130,246,0.3)]",
          },
        ].map(({ label, value, color, hover, glow }, index) => (
          <div
            key={index}
            className={`w-full h-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white shadow-md ${hover} ${glow} transition flex flex-col justify-between`}
          >
            <p className="text-sm text-white/60 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bridge CTA */}
      <div className="w-full flex justify-center lg:justify-end">
        <a
          href="https://bridge.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto text-center bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-medium px-6 py-3 rounded-xl shadow-lg transition-all"
        >
          Bridge your asset from EVM chain
        </a>
      </div>
    </div>
  );
};

export default SummaryHeader;
