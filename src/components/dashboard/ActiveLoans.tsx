// // src/components/dashboard/ActiveLoans.jsx
// import React from 'react';

// const ActiveLoans = ({ walletAddress }) => {
//   // Mock loan data
//   const activeLoans = walletAddress ? [
//     {
//       id: 'L001',
//       amount: 500,
//       collateral: '2.5 ETH',
//       interestRate: 8.5,
//       dueDate: '2025-08-15',
//       status: 'active',
//       type: 'reputation'
//     },
//     {
//       id: 'L002',
//       amount: 1200,
//       collateral: 'Ethereum NFT',
//       interestRate: 12.0,
//       dueDate: '2025-07-30',
//       status: 'active',
//       type: 'collateral'
//     }
//   ] : [];

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
//       case 'overdue': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
//       case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
//       default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
//     }
//   };

//   const getTypeIcon = (type) => {
//     return type === 'reputation' ? '🏆' : '🔒';
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
//           💳 Active Loans
//         </h3>
//         <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
//           + New Loan
//         </button>
//       </div>
      
//       {activeLoans.length > 0 ? (
//         <div className="space-y-4">
//           {activeLoans.map((loan) => (
//             <div key={loan.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-2">
//                   <span className="text-lg">{getTypeIcon(loan.type)}</span>
//                   <span className="font-medium text-gray-900 dark:text-white">
//                     Loan #{loan.id}
//                   </span>
//                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
//                     {loan.status}
//                   </span>
//                 </div>
//                 <div className="text-right">
//                   <div className="font-bold text-gray-900 dark:text-white">
//                     ${loan.amount}
//                   </div>
//                   <div className="text-sm text-gray-500 dark:text-gray-400">
//                     {loan.interestRate}% APR
//                   </div>
//                 </div>
//               </div>
              
//               <div className="grid grid-cols-2 gap-4 text-sm">
//                 <div>
//                   <span className="text-gray-500 dark:text-gray-400">Collateral:</span>
//                   <div className="font-medium text-gray-900 dark:text-white">
//                     {loan.collateral}
//                   </div>
//                 </div>
//                 <div>
//                   <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
//                   <div className="font-medium text-gray-900 dark:text-white">
//                     {new Date(loan.dueDate).toLocaleDateString()}
//                   </div>
//                 </div>
//               </div>
              
//               <div className="mt-3 flex gap-2">
//                 <button className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
//                   💰 Repay
//                 </button>
//                 <button className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
//                   📊 Details
//                 </button>
//               </div>
//             </div>
//           ))}
          
//           {/* Summary */}
//           <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
//             <div className="flex justify-between items-center">
//               <span className="font-medium text-blue-900 dark:text-blue-100">
//                 Total Active Debt:
//               </span>
//               <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
//                 ${activeLoans.reduce((sum, loan) => sum + loan.amount, 0)}
//               </span>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="text-center py-8">
//           <div className="text-4xl mb-4">🏦</div>
//           <div className="text-gray-500 dark:text-gray-400 mb-4">
//             {walletAddress ? 'No active loans' : 'Connect wallet to view loans'}
//           </div>
//           {walletAddress && (
//             <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
//               Get Your First Loan
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ActiveLoans;





interface ActiveLoansProps {
  walletAddress?: string;
}

const ActiveLoans: React.FC<ActiveLoansProps> = ({ walletAddress }) => {

  // Mock loan data
  const activeLoans = walletAddress ? [
    {
      id: 'L001',
      amount: 500,
      collateral: '2.5 ETH',
      interestRate: 8.5,
      dueDate: '2025-08-15',
      status: 'active',
      type: 'reputation'
    },
    {
      id: 'L002',
      amount: 1200,
      collateral: 'Ethereum NFT',
      interestRate: 12.0,
      dueDate: '2025-07-30',
      status: 'active',
      type: 'collateral'
    }
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'overdue': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'reputation' ? '🏆' : '🔒';
  };

  const handleRepay = async (loanId: string) => {
    try {
      console.log(`Processing repayment for Loan ${loanId}...`);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Loan ${loanId} repaid successfully!`);
    } catch (err) {
      console.error(`Error repaying Loan ${loanId}`, err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          💳 Active Loans
        </h3>
        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
          + New Loan
        </button>
      </div>

      {activeLoans.length > 0 ? (
        <div className="space-y-4">
          {activeLoans.map((loan) => (
            <div key={loan.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(loan.type)}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Loan #{loan.id}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                    {loan.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white">
                    ${loan.amount}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {loan.interestRate}% APR
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Collateral:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {loan.collateral}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(loan.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleRepay(loan.id)}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  💰 Repay
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
                  📊 Details
                </button>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Total Active Debt:
              </span>
              <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                ${activeLoans.reduce((sum, loan) => sum + loan.amount, 0)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🏦</div>
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            {walletAddress ? 'No active loans' : 'Connect wallet to view loans'}
          </div>
          {walletAddress && (
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Get Your First Loan
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveLoans;
