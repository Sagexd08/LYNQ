import { useState } from 'react';
import type { User } from '../types';

interface BorrowScreenProps {
    user: User;
    onConfirm: (amount: number) => void;
    onCancel: () => void;
}

export const BorrowScreen = ({ user, onConfirm, onCancel }: BorrowScreenProps) => {
    const reputation = user.reputation;
    const score = reputation?.score ?? 50;

    // Backend rule: score * 20
    const maxLimit = score * 20;
    const isBlocked = user.status === 'blocked';
    const hasActiveLoan = user.loans.some(l => l.status === 'active');
    const canBorrow = !isBlocked && !hasActiveLoan && maxLimit > 0;

    const [amount, setAmount] = useState(Math.min(100, maxLimit));

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(Number(e.target.value));
    };

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center">
                <h2 className="text-2xl font-medium text-white">Borrow Money</h2>
                <p className="text-neutral-400">Select amount to borrow</p>
            </div>

            <div className="bg-neutral-800 rounded-xl p-6 space-y-6 border border-neutral-700">
                <div className="text-center space-y-1">
                    <p className="text-4xl font-bold text-white">${amount}</p>
                    <p className="text-sm text-neutral-500">Maximum allowed: ${maxLimit}</p>
                </div>

                <div className="space-y-4">
                    {canBorrow ? (
                        <input
                            type="range"
                            min="50"
                            max={maxLimit}
                            step="10"
                            value={amount}
                            onChange={handleSliderChange}
                            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    ) : (
                        <div className="text-center text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-900/30">
                            {isBlocked ? 'Borrowing is paused for this account.' :
                                hasActiveLoan ? 'Please repay your active loan first.' :
                                    'Reputation too low to borrow.'}
                        </div>
                    )}
                </div>

                <div className="border-t border-neutral-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Duration</span>
                        <span className="text-white">14 Days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Due Date</span>
                        <span className="text-white">{dueDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Repayment Amount</span>
                        <span className="text-white font-medium">${amount}</span>
                    </div>
                </div>
            </div>

            {/* Warnings & Consequences */}
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/50 space-y-2">
                <h3 className="text-blue-200 font-medium text-sm flex items-center">
                    <span className="mr-2">ℹ️</span>
                    Consequences
                </h3>
                <ul className="text-xs text-blue-100/80 space-y-1 ml-6 list-disc">
                    <li>Missing the due date will lower your score.</li>
                    <li>Missing it twice (consecutive) will pause borrowing.</li>
                    <li>Early <span className="text-emerald-300">repayment (&gt;24h)</span> increases your limit.</li>
                </ul>
            </div>

            <div className="space-y-3 pt-4">
                <button
                    onClick={() => onConfirm(amount)}
                    disabled={!canBorrow || amount <= 0}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Confirm Borrow ${amount}
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-3 bg-transparent hover:bg-neutral-800 text-neutral-400 font-medium rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
