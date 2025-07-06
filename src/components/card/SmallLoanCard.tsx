// import React from 'react';

// const SmallLoanCard = ({ loan }) => {
//   return (
//     <div className="w-full bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md p-4 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20 hover:drop-shadow-glow">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-3">
//         <h3 className="text-lg font-semibold text-white truncate">
//           Loan #{loan?.id || 'TBD'}
//         </h3>
//         <span
//           className={`text-xs font-medium px-3 py-1 rounded-full border backdrop-blur-sm ${
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

//       {/* Loan Info */}
//       <div className="space-y-2 text-sm text-white/80">
//         <div className="flex justify-between">
//           <span>Amount:</span>
//           <span className="text-white font-semibold">
//             {loan?.amount || '$0'}
//           </span>
//         </div>
//         <div className="flex justify-between">
//           <span>Interest:</span>
//           <span className="text-white font-semibold">
//             {loan?.interest || '0%'}
//           </span>
//         </div>
//         <div className="flex justify-between">
//           <span>Due Date:</span>
//           <span className="text-white font-semibold">
//             {loan?.dueDate || 'TBD'}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SmallLoanCard;





import React, { useState } from "react";
import { AptosClient } from "aptos";

interface SmallLoan {
  id: number;
  amount: string;
  interest: string;
  dueDate: string;
  status: string;
}

interface SmallLoanCardProps {
  loan: SmallLoan;
}

const SmallLoanCard: React.FC<SmallLoanCardProps> = ({ loan }) => {
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = new AptosClient("https://fullnode.testnet.aptoslabs.com");

  const handleRepayLoan = async () => {
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
        function: "0xYourModuleAddress::smallloan::repay", // 🔁 Replace with actual module
        type_arguments: [],
        arguments: [loan?.id || 0],
      };

      const tx = await window.aptos.signAndSubmitTransaction(payload);
      await client.waitForTransaction(tx.hash);

      setTxHash(tx.hash);
      alert("✅ Repayment successful!");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Transaction failed";
      setError(errorMessage);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="w-full bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md p-4 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20 hover:drop-shadow-glow flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white truncate">
          Loan #{loan?.id || 'TBD'}
        </h3>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full border backdrop-blur-sm ${
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

      {/* Loan Info */}
      <div className="space-y-2 text-sm text-white/80 mb-4">
        <div className="flex justify-between">
          <span>Amount:</span>
          <span className="text-white font-semibold">{loan?.amount || '$0'}</span>
        </div>
        <div className="flex justify-between">
          <span>Interest:</span>
          <span className="text-white font-semibold">{loan?.interest || '0%'}</span>
        </div>
        <div className="flex justify-between">
          <span>Due Date:</span>
          <span className="text-white font-semibold">{loan?.dueDate || 'TBD'}</span>
        </div>
      </div>

      {/* Button */}
      <div>
        <button
          onClick={handleRepayLoan}
          disabled={isPaying}
          className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
        >
          {isPaying ? "Processing..." : "Repay Loan"}
        </button>

        {txHash && (
          <p className="text-green-400 text-xs mt-2">
            Tx:{" "}
            <a
              href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {txHash.slice(0, 12)}...
            </a>
          </p>
        )}
        {error && <p className="text-red-400 text-xs mt-1">❌ {error}</p>}
      </div>
    </div>
  );
};

export default SmallLoanCard;
