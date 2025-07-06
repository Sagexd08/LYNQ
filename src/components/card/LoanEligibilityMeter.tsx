import React from 'react';

interface Factor {
  name: string;
  score: number;
  impact?: string;
  value?: string | number;
}

interface UserData {
  walletAddress?: string;
  trustScore?: number;
  totalTransactions?: number;
  averageTransactionValue?: number;
  loanHistory?: {
    totalLoans: number;
    successfulRepayments: number;
    latePayments: number;
    defaults: number;
  };
  collateralValue?: number;
  stakingAmount?: number;
  accountAge?: number; // in days
  liquidityProvided?: number;
}

interface LoanEligibilityMeterProps {
  userData?: UserData;
  factors?: Factor[];
}

const LoanEligibilityMeter: React.FC<LoanEligibilityMeterProps> = ({ userData, factors }) => {
  
  // Calculate individual factor scores based on real data
  const calculateCreditHistoryScore = (userData?: UserData): number => {
    if (!userData?.loanHistory) return 0;
    
    const { totalLoans, successfulRepayments, latePayments, defaults } = userData.loanHistory;
    if (totalLoans === 0) return 50; // Default for new users
    
    const successRate = (successfulRepayments / totalLoans) * 100;
    const latePaymentPenalty = (latePayments / totalLoans) * 20;
    const defaultPenalty = (defaults / totalLoans) * 40;
    
    return Math.max(0, Math.min(100, successRate - latePaymentPenalty - defaultPenalty));
  };

  const calculateOnChainActivityScore = (userData?: UserData): number => {
    if (!userData) return 0;
    
    const transactionScore = Math.min(50, (userData.totalTransactions || 0) / 10);
    const valueScore = Math.min(30, (userData.averageTransactionValue || 0) / 100);
    const ageScore = Math.min(20, (userData.accountAge || 0) / 30);
    
    return transactionScore + valueScore + ageScore;
  };

  const calculateCollateralScore = (userData?: UserData): number => {
    if (!userData) return 0;
    
    const collateralValue = userData.collateralValue || 0;
    const stakingAmount = userData.stakingAmount || 0;
    const liquidityProvided = userData.liquidityProvided || 0;
    
    const totalValue = collateralValue + stakingAmount + liquidityProvided;
    return Math.min(100, totalValue / 1000); // Scale based on $1000 = 100%
  };

  const calculateTrustScore = (userData?: UserData): number => {
    return userData?.trustScore || 0;
  };

  const calculateLiquidityScore = (userData?: UserData): number => {
    if (!userData) return 0;
    
    const liquidityProvided = userData.liquidityProvided || 0;
    return Math.min(100, liquidityProvided / 500); // Scale based on $500 = 100%
  };

  // Calculate overall score from all factors
  const calculateOverallScore = (): number => {
    const creditHistory = calculateCreditHistoryScore(userData);
    const onChainActivity = calculateOnChainActivityScore(userData);
    const collateral = calculateCollateralScore(userData);
    const trust = calculateTrustScore(userData);
    const liquidity = calculateLiquidityScore(userData);
    
    // Weighted average
    const weightedScore = (
      creditHistory * 0.3 +
      onChainActivity * 0.2 +
      collateral * 0.25 +
      trust * 0.15 +
      liquidity * 0.1
    );
    
    return Math.round(weightedScore);
  };

  const overallScore = calculateOverallScore();

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

  const defaultFactors: Factor[] = [
    { 
      name: 'Credit History', 
      score: calculateCreditHistoryScore(userData),
      impact: 'High',
      value: userData?.loanHistory ? 
        `${userData.loanHistory.successfulRepayments}/${userData.loanHistory.totalLoans} repaid` : 
        'No history'
    },
    { 
      name: 'OnChain Activity', 
      score: calculateOnChainActivityScore(userData),
      impact: 'Medium',
      value: `${userData?.totalTransactions || 0} transactions`
    },
    { 
      name: 'Collateral Value', 
      score: calculateCollateralScore(userData),
      impact: 'High',
      value: `$${((userData?.collateralValue || 0) + (userData?.stakingAmount || 0)).toLocaleString()}`
    },
    { 
      name: 'Trust Score', 
      score: calculateTrustScore(userData),
      impact: 'Medium',
      value: `${userData?.trustScore || 0}/100`
    },
    { 
      name: 'Liquidity Provided', 
      score: calculateLiquidityScore(userData),
      impact: 'Low',
      value: `$${(userData?.liquidityProvided || 0).toLocaleString()}`
    }
  ];

  const eligibilityFactors = factors || defaultFactors;

  return (
    <div className="w-[360px] bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md p-6 shadow-lg shadow-cyan-500/10 space-y-8">
      <h3 className="text-xl font-bold text-white">Loan Eligibility</h3>

      {/* Stylized Circular Score Meter */}
      <div className="relative mx-auto w-40 h-40 rounded-full border-8 border-white/10 bg-white/5 backdrop-blur-md shadow-inner shadow-cyan-500/10 flex items-center justify-center">
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
            strokeDashoffset={283 - overallScore * 2.83}
            fill="none"
          />
        </svg>

        <div className="text-center z-10">
          <div className="text-3xl font-bold bg-yellow-400 bg-clip-text text-transparent">
            {overallScore}
          </div>
          <div className="text-sm text-gray-300">
            {getEligibilityText(overallScore)} Eligibility
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
              <div className="text-right">
                <span className="font-medium">{Math.min(100, Math.max(0, factor.score))}%</span>
                {factor.value && (
                  <div className="text-xs text-gray-400">{factor.value}</div>
                )}
              </div>
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
          {overallScore < 60 && (
            <>
              <li>Improve credit history with on-time payments</li>
              <li>Consider providing additional collateral</li>
            </>
          )}
          {overallScore >= 60 && overallScore < 80 && (
            <>
              <li>You qualify for standard rates</li>
              <li>Consider a co-signer for better terms</li>
            </>
          )}
          {overallScore >= 80 && (
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