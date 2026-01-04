import type { User } from '../types';

interface StatusScreenProps {
    user: User;
    onBorrow: () => void;
    onRepay: () => void;
    onHistory: () => void;
}

export const StatusScreen = ({ user, onBorrow, onRepay, onHistory }: StatusScreenProps) => {
    const reputation = user.reputation;
    const score = reputation?.score ?? 50;
    const activeLoan = user.loans?.find(l => l.status !== 'repaid');

    const getStatusColor = (status: string) => {
        if (status === 'blocked') return 'text-red-500';
        if (status === 'active') return 'text-emerald-400';
        return 'text-neutral-400';
    };

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-emerald-400';
        if (s >= 50) return 'text-yellow-400';
        return 'text-red-500';
    };

    // Logic for dynamic max amount based on score could be here, but for v0 we can keep it static or simple.
    // The PRD says "Maximum borrowable amount". Let's assume proportional to score or fixed tiers.
    // For simplicity: Base 500 + (Score - 50) * 10
    const maxBorrow = user.status === 'blocked' ? 0 : Math.max(0, 500 + (score - 50) * 10);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Score Section */}
            <div className="text-center space-y-4">
                <div className="inline-block relative">
                    {/* Simple Circle using CSS borders */}
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl font-bold ${getScoreColor(score)} border-current opacity-90 mx-auto`}>
                        {score}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-medium text-white">Reputation Score</h2>
                    <p className={`text-sm uppercase tracking-wider font-bold mt-1 ${getStatusColor(user.status)}`}>
                        {user.status === 'blocked' ? 'Borrowing Paused' : user.status === 'active' ? 'Good Standing' : user.status}
                    </p>
                </div>
            </div>

            {/* Action / Context Section */}
            <div className="bg-neutral-800 rounded-xl p-6 space-y-4 border border-neutral-700">
                {activeLoan ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-neutral-400 text-sm">Active Loan</p>
                                <p className="text-2xl font-bold text-white">${activeLoan.amount}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-neutral-400 text-sm">Due Date</p>
                                <p className="text-white font-medium">
                                    {new Date(activeLoan.dueAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-neutral-700">
                            <p className="text-sm text-yellow-500 mb-4">
                                {activeLoan.lateDays > 0
                                    ? `Overdue by ${activeLoan.lateDays} day(s)`
                                    : 'Repayment is due soon.'}
                            </p>

                            <button
                                onClick={onRepay}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
                            >
                                Repay Loan
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <div>
                            <p className="text-neutral-400 text-sm">Available Limit</p>
                            <p className="text-3xl font-bold text-white">${maxBorrow}</p>
                        </div>

                        {user.status === 'blocked' ? (
                            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-200 text-sm">
                                Your borrowing is paused due to low reputation or consecutive late payments.
                                <br />
                                <span className="opacity-70 text-xs mt-1 block">Improve your score to unlock.</span>
                            </div>
                        ) : (
                            <button
                                onClick={onBorrow}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                            >
                                Borrow Money
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="text-center">
                <button
                    onClick={onHistory}
                    className="text-neutral-500 hover:text-white text-sm underline underline-offset-4 transition-colors"
                >
                    View Reputation History
                </button>
            </div>
        </div>
    );
};
