// import React from 'react';

// const BigLoanCard = ({ loan }) => {
//   return (
//     <div className="w-full bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md p-6 shadow-lg shadow-cyan-500/10 space-y-6">
      
//       Header
//       <div className="flex justify-between items-start">
//         <div>
//           <h2 className="text-xl md:text-2xl font-bold text-white">
//             Loan #{loan?.id || 'TBD'}
//           </h2>
//           <p className="text-white/70 text-sm">{loan?.type || 'Personal Loan'}</p>
//         </div> 
//         <span
//           className={`px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm ${
//             loan?.status === 'Active'
//               ? 'bg-green-400/10 text-green-400 border-green-400/30'
//               : loan?.status === 'Pending'
//               ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30'
//               : 'bg-gray-400/10 text-gray-300 border-gray-400/30'
//           }`}
//         >
//           {loan?.status || 'Active'}
//         </span>
//       </div>

//       {/* Principal Amount */}
//       <div className="bg-white/5 border border-cyan-400/10 rounded-lg p-4 text-center shadow-inner shadow-cyan-500/5">
//         <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
//           {loan?.amount || '$0'}
//         </div>
//         <p className="text-white/70 text-sm">Principal Amount</p>
//       </div>

//       {/* Details Grid */}
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <p className="text-white/60 text-xs">Interest Rate</p>
//           <p className="text-white text-base font-medium">
//             {loan?.interestRate || '0%'}
//           </p>
//         </div>
//         <div>
//           <p className="text-white/60 text-xs">Term</p>
//           <p className="text-white text-base font-medium">
//             {loan?.term || '0 months'}
//           </p>
//         </div>
//       </div>

//       {/* Payment Info */}
//       <div className="text-sm text-white/80 space-y-2">
//         <div className="flex justify-between">
//           <span>Monthly Payment:</span>
//           <span className="text-white font-semibold">{loan?.monthlyPayment || '$0'}</span>
//         </div>
//         <div className="flex justify-between">
//           <span>Next Payment:</span>
//           <span className="text-white font-semibold">{loan?.nextPayment || 'TBD'}</span>
//         </div>
//         <div className="flex justify-between">
//           <span>Remaining Balance:</span>
//           <span className="text-white font-semibold">{loan?.remainingBalance || '$0'}</span>
//         </div>
//       </div>

//       {/* CTA Button */}
//       <button className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 text-white py-2.5 px-4 rounded-lg border border-cyan-400/20 transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/30 hover:scale-[1.02]">
//         Make Payment
//       </button>
//     </div>
//   );
// };

// export default BigLoanCard;





import React, { useState } from "react";
import { AptosClient } from "aptos";

interface Loan {
  id: string;
  amount: string;
  interestRate: string;
  term: string;
  monthlyPayment: string;
  nextPayment: string;
  remainingBalance: string;
  status: string;
}

interface BigLoanCardProps {
  loan: Loan;
}

const BigLoanCard: React.FC<BigLoanCardProps> = ({ loan }) => {
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = new AptosClient("https://fullnode.testnet.aptoslabs.com");

  const handlePayment = async () => {
    if (!window.aptos) {
      alert("❌ Wallet not connected");
      return;
    }

    setIsPaying(true);
    setError(null);
    setTxHash(null);

    try {
      const payload = {
        type: "entry_function_payload",
        function: "0xYourModuleAddress::loan::make_payment", // ✅ Replace with your module address
        type_arguments: [],
        arguments: [loan.id], // You may need to pass more depending on your Move func
      };

      const tx = await window.aptos.signAndSubmitTransaction(payload);
      await client.waitForTransaction(tx.hash);

      setTxHash(tx.hash);
      alert("✅ Payment Successful!");
    } catch (err: unknown) {
      console.error("Payment failed", err);
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-4 text-sm text-white/80">
      <h3 className="text-xl font-bold text-white">💰 Big Loan Overview</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-white/60">Loan Amount</label>
          <div className="font-bold text-green-400">{loan.amount}</div>
        </div>
        <div>
          <label className="block mb-1 text-white/60">Interest Rate</label>
          <div className="font-bold text-yellow-300">{loan.interestRate}</div>
        </div>
        <div>
          <label className="block mb-1 text-white/60">Term</label>
          <div>{loan.term}</div>
        </div>
        <div>
          <label className="block mb-1 text-white/60">Monthly Payment</label>
          <div>{loan.monthlyPayment}</div>
        </div>
        <div>
          <label className="block mb-1 text-white/60">Next Due</label>
          <div>{loan.nextPayment}</div>
        </div>
        <div>
          <label className="block mb-1 text-white/60">Status</label>
          <span className="px-3 py-1 rounded-full bg-green-700 text-white text-xs">
            {loan.status}
          </span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={isPaying}
        className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50"
      >
        {isPaying ? "Processing..." : "Make Payment"}
      </button>

      {txHash && (
        <div className="text-green-400 mt-2 text-xs">
          ✅ Tx:{" "}
          <a
            className="underline"
            href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
            target="_blank"
            rel="noreferrer"
          >
            {txHash.slice(0, 12)}...
          </a>
        </div>
      )}

      {error && <div className="text-red-400 mt-2 text-xs">❌ {error}</div>}
    </div>
  );
};

export default BigLoanCard;
