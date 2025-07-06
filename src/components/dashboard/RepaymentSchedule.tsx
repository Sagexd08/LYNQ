// src/components/dashboard/RepaymentSchedule.tsx

interface RepaymentScheduleProps {
  walletAddress?: string;
}

const RepaymentSchedule: React.FC<RepaymentScheduleProps> = ({ walletAddress }) => {
  // Mock repayment schedule data
  const repayments = walletAddress ? [
    {
      id: 'R001',
      loanId: 'L001',
      amount: 125,
      dueDate: '2025-07-15',
      status: 'upcoming',
      type: 'principal + interest'
    },
    {
      id: 'R002',
      loanId: 'L002',
      amount: 300,
      dueDate: '2025-07-30',
      status: 'upcoming',
      type: 'principal + interest'
    },
    {
      id: 'R003',
      loanId: 'L001',
      amount: 125,
      dueDate: '2025-08-15',
      status: 'scheduled',
      type: 'principal + interest'
    }
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'paid': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'overdue': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          📅 Repayment Schedule
        </h3>
        <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
          Auto-Pay Setup
        </button>
      </div>
      
      {repayments.length > 0 ? (
        <div className="space-y-3">
          {repayments.map((repayment) => {
            const daysUntil = getDaysUntilDue(repayment.dueDate);
            return (
              <div key={repayment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {repayment.loanId.slice(-1)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Loan #{repayment.loanId}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {repayment.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      ${repayment.amount}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(repayment.status)}`}>
                      {repayment.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Due: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(repayment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`font-medium ${
                    daysUntil <= 7 ? 'text-red-600 dark:text-red-400' : 
                    daysUntil <= 14 ? 'text-orange-600 dark:text-orange-400' : 
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {daysUntil > 0 ? `${daysUntil} days left` : 
                     daysUntil === 0 ? 'Due today' : 
                     `${Math.abs(daysUntil)} days overdue`}
                  </div>
                </div>
                
                {repayment.status === 'upcoming' && (
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                      💰 Pay Now
                    </button>
                    <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
                      ⏰ Schedule
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Next Payment Summary */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-yellow-900 dark:text-yellow-100">
                  Next Payment Due
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  {new Date(repayments[0]?.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                  ${repayments[0]?.amount}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  {getDaysUntilDue(repayments[0]?.dueDate)} days
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📅</div>
          <div className="text-gray-500 dark:text-gray-400">
            {walletAddress ? 'No scheduled repayments' : 'Connect wallet to view schedule'}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepaymentSchedule;
