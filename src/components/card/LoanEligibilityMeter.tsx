import React from 'react';

interface Factor {
  name: string;
  score: number;
  impact: string;
}

interface LoanEligibilityMeterProps {
  score: number;
  factors?: Factor[];
}

const LoanEligibilityMeter: React.FC<LoanEligibilityMeterProps> = ({ score, factors }) => {
  const getBarColor = (score: number): string => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-400';
    if (score >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getEligibilityText = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const defaultFactors = [
    { name: 'Credit History', score: score || 0, weight: 30 },
    { name: 'Income Stability', score: (score || 0) + 5, weight: 25 },
    { name: 'Debt-to-Income', score: (score || 0) - 10, weight: 20 },
    { name: 'Collateral Value', score: (score || 0) + 10, weight: 15 },
    { name: 'On-chain Activity', score: (score || 0) - 5, weight: 10 }
  ];

  const eligibilityFactors = factors || defaultFactors;

  return (
    <div className="w-[360px] bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md p-6 shadow-lg shadow-cyan-500/10 space-y-8">

      <h3 className="text-xl font-bold text-white">Loan Eligibility</h3>

      {/* Stylized Circular Score Meter */}
      <div className="relative mx-auto w-40 h-40 rounded-full border-8 border-white/10 bg-white/5 backdrop-blur-md shadow-inner shadow-cyan-500/10 flex items-center justify-center">
        {/* Optional animated glow ring */}
        <div className="absolute -inset-2 rounded-full bg-yellow-400/10 blur-xl animate-pulse"></div>


        <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="white"
            strokeOpacity="0.1"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeLinecap="round"
            stroke="#facc15"
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset={`${283 - (score || 0) * 2.83}`}
            fill="none"
          />
        </svg>

        <div className="text-center z-10">
          <div className="text-3xl font-bold bg-yellow-400 bg-clip-text text-transparent">
            {score || 0}
          </div>
          <div className="text-sm text-gray-300">
            {getEligibilityText(score || 0)} Eligibility
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-4">
        <h4 className="font-semibold text-white border-b border-white/10 pb-2">Factors</h4>
        {eligibilityFactors.map((factor, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>{factor.name}</span>
              <span className="font-medium">{Math.min(100, Math.max(0, factor.score))}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className={`h-2 ${getBarColor(factor.score)} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, factor.score))}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-400/10 border border-white/10">
        <h5 className="font-semibold text-white mb-2">Recommendations</h5>
        <ul className="text-sm text-white/80 space-y-1 list-disc list-inside">
          {(score || 0) < 60 && (
            <>
              <li>Improve credit history with on-time payments</li>
              <li>Consider providing additional collateral</li>
            </>
          )}
          {(score || 0) >= 60 && (score || 0) < 80 && (
            <>
              <li>You qualify for standard rates</li>
              <li>Consider a co-signer for better terms</li>
            </>
          )}
          {(score || 0) >= 80 && (
            <>
              <li>Excellent! You qualify for our best rates</li>
              <li>Consider larger loan amounts if needed</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default LoanEligibilityMeter;