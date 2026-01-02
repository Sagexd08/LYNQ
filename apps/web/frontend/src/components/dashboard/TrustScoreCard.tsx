import React from "react";
import { motion } from "framer-motion";

interface TrustScoreCardProps {
  score: number | null;
}

const TrustScoreCard: React.FC<TrustScoreCardProps> = ({ score }) => {
  const safeScore = score ?? 0;

  
  
  let tier = "BRONZE";
  let color = "text-orange-400";
  let ringColor = "#FB923C";

  if (safeScore >= 90) { tier = "PLATINUM"; color = "text-neon-cyan"; ringColor = "#00E5FF"; }
  else if (safeScore >= 70) { tier = "GOLD"; color = "text-yellow-400"; ringColor = "#FACC15"; }
  else if (safeScore >= 40) { tier = "SILVER"; color = "text-gray-300"; ringColor = "#D1D5DB"; }

  
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = (safeScore / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-deep-purple" />

      <div className="flex flex-col items-center">
        <h2 className="text-white/80 font-heading tracking-wider mb-6">CREDIT INTELLIGENCE</h2>

        {}
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            <motion.circle
              cx="96"
              cy="96"
              r={radius}
              fill="transparent"
              stroke={ringColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="drop-shadow-glow"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white font-mono">{safeScore}</span>
            <span className={`text-xs font-bold tracking-widest mt-1 ${color}`}>{tier}</span>
          </div>
        </div>

        {}
        <div className={`px-4 py-1 rounded-full border bg-white/5 ${color} border-current/30 text-sm font-bold tracking-wider mb-4 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
          {tier} TIER
        </div>

        {}
        <div className="w-full bg-black/30 rounded-lg p-3">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>ML Confidence</span>
            <span className="text-green-400">98% (High)</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-400"
              initial={{ width: 0 }}
              animate={{ width: "98%" }}
              transition={{ delay: 1, duration: 1 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrustScoreCard;
