import { useState } from 'react';
import { ArrowLeft, Wallet, Link2, CheckCircle } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/shared/Buttons';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import { useRiskEvaluation } from '@/hooks/useRisk';
import { useWallet } from '@/hooks/useWallet';
import { useLoanContract } from '@/hooks/useLoanContract';
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
  const wallet = useWallet();
  const loanContract = useLoanContract();

  const [loanAmount, setLoanAmount] = useState('');
  const [termMonths, setTermMonths] = useState('6');
  const [collateralValue, setCollateralValue] = useState('');
  const [useOnChain, setUseOnChain] = useState(true);

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
      if (useOnChain && wallet.isConnected && loanContract.isContractAvailable) {
        toast.loading('Creating loan on blockchain...', { id: 'onchain-create' });

        const termDays = parseInt(termMonths) * 30;
        const interestRateBps = riskData ? Math.round(riskData.interestRate * 100) : 1000;

        const onChainResult = await loanContract.createLoanOnChain({
          amount: parseFloat(loanAmount),
          interestRateBps,
          termDays,
        });

        if (onChainResult) {
          toast.success(`Loan created on-chain! TX: ${onChainResult.txHash.slice(0, 10)}...`, { id: 'onchain-create' });
        } else {
          toast.error(loanContract.error || 'Failed to create on-chain loan', { id: 'onchain-create' });
          return;
        }
      }

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
        { }
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

        {/* Wallet Connection Section */}
        <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-cyan-400" />
                Blockchain Wallet
              </h2>
              {wallet.isConnected ? (
                <div className="space-y-1 text-gray-300">
                  <p>
                    <span className="text-cyan-400">Address:</span>{' '}
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </p>
                  <p>
                    <span className="text-cyan-400">Network:</span>{' '}
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {wallet.chainName}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-400">Connect your wallet for on-chain transactions</p>
              )}
            </div>
            {wallet.isConnected ? (
              <Button variant="secondary" onClick={wallet.disconnect}>
                Disconnect Wallet
              </Button>
            ) : (
              <Button onClick={wallet.connect} disabled={wallet.isConnecting}>
                {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
          {wallet.error && (
            <p className="mt-2 text-red-400 text-sm">{wallet.error}</p>
          )}
        </div>

        { }
        <div className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Request a Loan</h2>
          <div className="space-y-4">
            {/* On-Chain Toggle */}
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded border border-gray-700">
              <input
                type="checkbox"
                id="onchain-toggle"
                checked={useOnChain}
                onChange={(e) => setUseOnChain(e.target.checked)}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="onchain-toggle" className="flex items-center gap-2 cursor-pointer">
                <Link2 className="w-5 h-5 text-cyan-400" />
                <span className="font-medium">Create loan on blockchain</span>
                {!wallet.isConnected && useOnChain && (
                  <span className="text-xs text-yellow-400">(requires wallet connection)</span>
                )}
              </label>
            </div>
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

        { }
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
