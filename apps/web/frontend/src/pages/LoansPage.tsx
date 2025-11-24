import React, { Suspense, useMemo } from 'react';
import { LoadingFallback } from '../components/Loading';
import {
  LazyLoanRequestForm,
  LazyBigLoanCard,
  LazySmallLoanCard,
  LazyLoanEligibilityMeter,
} from '../lazyComponents';

const LoansPage: React.FC = () => {
  const sampleLoans = useMemo(() => ({
    bigLoan: {
      id: '001',
      amount: '$5,000',
      interestRate: '8.5%',
      duration: '12 months',
      collateral: '2 ETH',
      status: 'active',
    },
    smallLoans: [
      {
        id: '002',
        amount: '$1,000',
        interestRate: '10%',
        duration: '6 months',
        collateral: '0.5 ETH',
        status: 'pending',
      },
      {
        id: '003',
        amount: '$500',
        interestRate: '12%',
        duration: '3 months',
        collateral: '0.25 ETH',
        status: 'active',
      },
    ],
  }), []);
  return (
    <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto text-white space-y-12">
      <div className="text-center space-y-2 mt-20">
        <h1 className="p-2 text-3xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-400 via-blue-400 to-teal-300 bg-clip-text text-transparent drop-shadow-md opacity-90">
          Loan Management
        </h1>
        <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
          Manage your active loans, request new ones, and track your
          eligibility.
        </p>
      </div>
      <div className="flex gap-10 w-screen">
        <div className="w-3/6 flex flex-col gap-10 border border-white/10 py-10 px-4 rounded-2xl">
          <Suspense fallback={<LoadingFallback minHeight="150px" />}>
            <LazyLoanRequestForm />
          </Suspense>
          <div className="border w-full border-white/50"></div>
          <Suspense fallback={<LoadingFallback minHeight="200px" />}>
            <LazyBigLoanCard loan={sampleLoans.bigLoan} />
          </Suspense>
          <div className="border w-full border-white/50"></div>
          <div className="grid grid-cols-2 gap-2">
            <Suspense fallback={<LoadingFallback minHeight="100px" size="sm" />}>
              {sampleLoans.smallLoans.map((loan: any) => (
                <LazySmallLoanCard key={loan.id} loan={loan} />
              ))}
            </Suspense>
          </div>
        </div>
        <div className="w-2/6">
          <Suspense fallback={<LoadingFallback minHeight="150px" />}>
            <LazyLoanEligibilityMeter score={75} />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

export default LoansPage;
