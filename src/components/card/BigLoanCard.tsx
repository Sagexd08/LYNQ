import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LoanRepaymentService } from '../../services/loanRepaymentService';

interface Loan {
  id: string;
  amount: string;
  interestRate: string;
  term: string;
  status: string;
  type: string;
  remainingBalance?: string;
  monthlyPayment?: string;
  dueDate?: string;
  totalInterest?: string;
  lateFee?: string;
  contractAddress?: string;
}

interface BigLoanCardProps {
  loan: Loan;
}

const BigLoanCard: React.FC<BigLoanCardProps> = ({ loan }) => {
  const [repaymentService, setRepaymentService] = useState<LoanRepaymentService | null>(null);
  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'partial' | 'full'>('partial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  useEffect(() => {
    const initService = async () => {
      if (loan?.contractAddress && typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const service = new LoanRepaymentService(loan.contractAddress, provider);
          await service.connectSigner();
          setRepaymentService(service);
          
          
          const details = await service.getLoanDetails(loan.id);
          setLoanDetails(details);
        } catch (err) {
          console.error('Failed to initialize repayment service:', err);
          setError('Failed to connect to loan contract');
        }
      }
    };

    initService();
  }, [loan?.contractAddress, loan?.id]);

  const handlePayment = async () => {
    if (!repaymentService || (!paymentAmount && paymentType === 'partial')) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      let tx;
      
      if (paymentType === 'full') {
        tx = await repaymentService.executeFullRepayment(loan.id);
      } else {
        const amount = ethers.parseEther(paymentAmount);
        tx = await repaymentService.executePartialRepayment(loan.id, amount.toString());
      }

      if (tx) {
        setSuccess(`Payment successful! Transaction: ${tx.hash}`);
        setPaymentAmount('');
        
        
        await tx.wait();
        
        
        const updatedDetails = await repaymentService.getLoanDetails(loan.id);
        setLoanDetails(updatedDetails);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  return (
    <div className="w-full bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md p-6 shadow-lg shadow-cyan-500/10 space-y-6">
      
      {}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Loan #{loan?.id || 'TBD'}
          </h2>
          <p className="text-white/70 text-sm">{loan?.type || 'Personal Loan'}</p>
        </div> 
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm ${
            loan?.status === 'Active'
              ? 'bg-green-400/10 text-green-400 border-green-400/30'
              : loan?.status === 'Pending'
              ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30'
              : 'bg-gray-400/10 text-gray-300 border-gray-400/30'
          }`}
        >
          {loan?.status || 'Active'}
        </span>
      </div>

      {}
      <div className="bg-white/5 border border-cyan-400/10 rounded-lg p-4 text-center shadow-inner shadow-cyan-500/5">
        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
          {loanDetails ? formatCurrency(ethers.formatEther(loanDetails.remainingBalance)) : (loan?.amount || '$0')}
        </div>
        <p className="text-white/70 text-sm">
          {loanDetails ? 'Remaining Balance' : 'Principal Amount'}
        </p>
      </div>

      {}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-white/60 text-xs">Interest Rate</p>
          <p className="text-white text-base font-medium">
            {loanDetails ? `${(Number(loanDetails.interestRate) / 100).toFixed(2)}%` : (loan?.interestRate || '0%')}
          </p>
        </div>
        <div>
          <p className="text-white/60 text-xs">Monthly Payment</p>
          <p className="text-white text-base font-medium">
            {loanDetails ? formatCurrency(ethers.formatEther(loanDetails.monthlyPayment)) : (loan?.monthlyPayment || '$0')}
          </p>
        </div>
      </div>

      {}
      {loanDetails && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-xs">Late Fee</p>
            <p className="text-white text-base font-medium">
              {formatCurrency(ethers.formatEther(loanDetails.lateFee))}
            </p>
          </div>
          <div>
            <p className="text-white/60 text-xs">Interest Owed</p>
            <p className="text-white text-base font-medium">
              {formatCurrency(ethers.formatEther(loanDetails.interestOwed))}
            </p>
          </div>
        </div>
      )}

      {}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
          {success}
        </div>
      )}

      {}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">Make Payment</h3>
        
        {}
        <div className="flex space-x-4">
          <button
            onClick={() => setPaymentType('partial')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              paymentType === 'partial'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
            }`}
          >
            Partial Payment
          </button>
          <button
            onClick={() => setPaymentType('full')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              paymentType === 'full'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
            }`}
          >
            Full Payment
          </button>
        </div>

        {}
        {paymentType === 'partial' && (
          <div>
            <label className="block text-white/60 text-xs mb-2">Payment Amount (ETH)</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        )}

        {}
        <button
          onClick={handlePayment}
          disabled={isProcessing || (!paymentAmount && paymentType === 'partial')}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg"
        >
          {isProcessing 
            ? 'Processing...' 
            : paymentType === 'full' 
              ? 'Pay Full Amount' 
              : 'Make Payment'
          }
        </button>
      </div>
    </div>
  );
};

export default BigLoanCard;
