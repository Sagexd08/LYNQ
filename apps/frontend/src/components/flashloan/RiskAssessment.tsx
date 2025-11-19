import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { flashLoanService } from '../../services/flashLoanService';
import { toast } from 'react-hot-toast';

export const RiskAssessment: React.FC = () => {
  const { walletAddress } = useWalletStore();
  const [riskData, setRiskData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadRiskAssessment();
    }
  }, [walletAddress]);

  const loadRiskAssessment = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const data = await flashLoanService.getRiskAssessment(walletAddress);
      setRiskData(data);
    } catch (error) {
      toast.error('Failed to load risk assessment');
      console.error('Error loading risk assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Risk Assessment</h3>
        <div className="flex justify-center items-center h-32">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!riskData) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Risk Assessment</h3>
          <button
            onClick={loadRiskAssessment}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Refresh
          </button>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>Connect your wallet to view risk assessment</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-orange-400';
      case 'Critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-900/30 border-green-700';
      case 'Medium': return 'bg-yellow-900/30 border-yellow-700';
      case 'High': return 'bg-orange-900/30 border-orange-700';
      case 'Critical': return 'bg-red-900/30 border-red-700';
      default: return 'bg-gray-900/30 border-gray-700';
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Risk Assessment</h3>
        <button
          onClick={loadRiskAssessment}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Refresh
        </button>
      </div>

      {/* Risk Score */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Risk Score</span>
          <span className={`text-2xl font-bold ${getRiskColor(riskData.riskLevel)}`}>
            {riskData.riskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              riskData.riskScore < 30 ? 'bg-green-500' :
              riskData.riskScore < 60 ? 'bg-yellow-500' :
              riskData.riskScore < 80 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${riskData.riskScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
      </div>

      {/* Risk Level */}
      <div className={`mb-6 p-4 rounded-lg border ${getRiskBgColor(riskData.riskLevel)}`}>
        <div className="flex items-center">
          <div className={`mr-3 p-2 rounded-full ${
            riskData.riskLevel === 'Low' ? 'bg-green-900/50' :
            riskData.riskLevel === 'Medium' ? 'bg-yellow-900/50' :
            riskData.riskLevel === 'High' ? 'bg-orange-900/50' : 'bg-red-900/50'
          }`}>
            {riskData.riskLevel === 'Low' ? (
              <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <h4 className="font-medium text-white">Risk Level: {riskData.riskLevel}</h4>
            <p className="text-sm text-gray-300">
              {riskData.riskLevel === 'Low' 
                ? 'You have a good track record for flash loans'
                : riskData.riskLevel === 'Medium'
                ? 'Moderate risk - proceed with caution'
                : riskData.riskLevel === 'High'
                ? 'High risk - consider smaller amounts'
                : 'Critical risk - not recommended for flash loans'}
            </p>
          </div>
        </div>
      </div>

      {/* Trust Score */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Trust Score</span>
          <span className="text-white font-medium">{riskData.trustScore}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-blue-500"
            style={{ width: `${Math.min(100, riskData.trustScore / 10)}%` }}
          ></div>
        </div>
      </div>

      {/* Risk Factors */}
      {riskData.factors.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-white mb-3">Risk Factors</h4>
          <div className="space-y-2">
            {riskData.factors.map((factor: any, index: number) => (
              <div key={index} className="flex items-start">
                <div className={`mr-2 mt-1 ${
                  factor.impact === 'positive' ? 'text-green-400' :
                  factor.impact === 'negative' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {factor.impact === 'positive' ? (
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{factor.factor}</div>
                  <div className="text-xs text-gray-400">{factor.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {riskData.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-white mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {riskData.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start">
                <svg className="h-4 w-4 text-indigo-400 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cooldown */}
      {riskData.cooldownPeriod > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center text-sm text-orange-300">
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Cooldown period: {Math.ceil(riskData.cooldownPeriod / 60)} minutes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
