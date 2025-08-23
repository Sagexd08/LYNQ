import React from "react";

interface TrustScoreCardProps {
  score: number | null;
}

const TrustScoreCard: React.FC<TrustScoreCardProps> = ({ score }) => {
  const safeScore = score ?? 0;
  const tier: number = safeScore >= 86 ? 4 : safeScore >= 61 ? 3 : safeScore >= 31 ? 2 : 1;
  const tierLabels = ["Ineligible", "Basic", "Standard", "Advanced", "Elite"];
  const tierLabel: string = tierLabels[tier] || "Basic";

  return (
    <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6 rounded-xl shadow-xl w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">🎖 TrustScore NFT</h2>
      <p className="text-5xl font-extrabold tracking-widest">{safeScore}</p>
      <p className="text-lg mt-2">Tier: <span className="font-semibold">{tierLabel}</span></p>
      <p className="text-xs mt-1 text-white/70">Dynamic reputation from loan activity</p>
    </div>
  );
};

export default TrustScoreCard;
