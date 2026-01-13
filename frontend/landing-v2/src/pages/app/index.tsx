import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/shared/Buttons';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import { useRiskEvaluation } from '@/hooks/useRisk';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import toast from 'react-hot-toast';

export default function AppPage() {
  return (
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  );
}

function AppContent() {
  const { profile, disconnect } = useAuth();
  const { loans, isLoading: loansLoading, createLoan, isCreatingLoan } = useLoans();
  const { evaluateRisk, riskData, isLoading: riskLoading } = useRiskEvaluation();
  
  const [loanAmount, setLoanAmount] = useState('');
  const [termMonths, setTermMonths] = useState('6');
  const [collateralValue, setCollateralValue] = useState('');

  const handleEvaluateRisk = async () => {
    if (!loanAmount || !termMonths) {
      toast.error('Please enter loan amount and term');
      return;
    }

    try {
      await evaluateRisk({
        walletAddress: profile?.walletAddress || '',
        loanAmount: parseFloat(loanAmount),
        termMonths: parseInt(termMonths),
        collateralValueUsd: collateralValue ? parseFloat(collateralValue) : undefined,
      });
    } catch (error) {
      
    }
  };

  const handleCreateLoan = async () => {
    if (!loanAmount || !termMonths) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createLoan({
        amount: parseFloat(loanAmount),
        termMonths: parseInt(termMonths),
        collateralValueUsd: collateralValue ? parseFloat(collateralValue) : undefined,
      });

      setLoanAmount('');
      setCollateralValue('');
    } catch (error) {
      
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto">
        {}
        <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Profile</h2>
              {profile && (
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-cyan-400">Wallet:</span>{' '}
                    {profile.walletAddress}
                  </p>
                  <p>
                    <span className="text-cyan-400">Tier:</span>{' '}
                    <span className="capitalize">{profile.tier.toLowerCase()}</span>
                  </p>
                  <p>
                    <span className="text-cyan-400">Reputation Score:</span>{' '}
                    {profile.reputationScore}
                  </p>
                  <p>
                    <span className="text-cyan-400">Total Loans:</span>{' '}
                    {profile.totalLoans} ({profile.successfulLoans} successful)
                  </p>
                </div>
              )}
            </div>
            <Button variant="secondary" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </div>

        {}
        <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Request a Loan</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Loan Amount (USD)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Term (Months)
              </label>
              <select
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Collateral Value (USD) - Optional
              </label>
              <input
                type="number"
                value={collateralValue}
                onChange={(e) => setCollateralValue(e.target.value)}
                placeholder="1500"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            {riskData && (
              <div className="p-4 bg-gray-800 rounded border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Risk Assessment:</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-cyan-400">Credit Score:</span>{' '}
                    {riskData.creditScore}
                  </p>
                  <p>
                    <span className="text-cyan-400">Risk Level:</span>{' '}
                    {riskData.riskLevel}
                  </p>
                  <p>
                    <span className="text-cyan-400">Interest Rate:</span>{' '}
                    {riskData.interestRate}%
                  </p>
                  <p>
                    <span className="text-cyan-400">Max Loan Amount:</span>{' '}
                    ${riskData.maxLoanAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={handleEvaluateRisk}
                disabled={riskLoading || !loanAmount}
                variant="secondary"
                className="flex-1"
              >
                {riskLoading ? 'Evaluating...' : 'Check Risk'}
              </Button>
              <Button
                onClick={handleCreateLoan}
                disabled={isCreatingLoan || !loanAmount}
                className="flex-1"
              >
                {isCreatingLoan ? 'Creating...' : 'Request Loan'}
              </Button>
            </div>
          </div>
        </div>

        {}
        <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Your Loans</h2>
          {loansLoading ? (
            <p className="text-gray-400">Loading loans...</p>
          ) : loans.length === 0 ? (
            <p className="text-gray-400">No loans yet. Create your first loan above!</p>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 bg-gray-800 rounded border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">
                        ${loan.amount.toLocaleString()} at {loan.interestRate}% APR
                      </p>
                      <p className="text-sm text-gray-400">
                        Status: <span className="capitalize">{loan.status.toLowerCase()}</span>
                      </p>
                    </div>
                    {loan.riskLevel && (
                      <span className="px-2 py-1 text-xs rounded bg-cyan-900 text-cyan-200">
                        {loan.riskLevel}
                      </span>
                    )}
                  </div>
                  {loan.dueDate && (
                    <p className="text-sm text-gray-400">
                      Due: {new Date(loan.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  {loan.amountRepaid > 0 && (
                    <p className="text-sm text-gray-400">
                      Repaid: ${loan.amountRepaid.toLocaleString()} / $
                      {loan.amount.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = '/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to landing
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
