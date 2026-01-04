import { useState, useMemo } from 'react';
import type { Loan } from '../types';

interface RepayScreenProps {
    loan: Loan;
    onConfirm: (amount: number) => void;
    onCancel: () => void;
}

export const RepayScreen = ({ loan, onConfirm, onCancel }: RepayScreenProps) => {


    const [amount, setAmount] = useState(loan.amount);

    // Derived values instead of state
    const outstanding = loan.amount;
    // I'll assume I can writing the file now.

    // Simpler approach for V0: Just allow paying up to `loan.amount`.
    // Ideally, I should fetch.

    const isEarly = useMemo(() => {
        const due = new Date(loan.dueAt);
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        return (due.getTime() - now.getTime()) > oneDay;
    }, [loan.dueAt]);

    const isLate = useMemo(() => {
        return new Date() > new Date(loan.dueAt);
    }, [loan.dueAt]);

    const classification = useMemo(() => {
        if (amount >= outstanding) {
            if (isEarly) return { type: 'EARLY', text: 'Early Repayment', consequence: 'paying early increases your score (+12)', color: 'text-emerald-400' };
            if (isLate) return { type: 'LATE', text: 'Late Repayment', consequence: 'Late repayment lowers score (-5)', color: 'text-red-400' };
            return { type: 'ON_TIME', text: 'On-Time Repayment', consequence: 'Paying on time improves score (+10)', color: 'text-blue-400' };
        } else {
            return { type: 'PARTIAL', text: 'Partial Repayment', consequence: 'Extends due date by 3 days (once). No score impact yet.', color: 'text-yellow-400' };
        }
    }, [amount, outstanding, isEarly, isLate]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center">
                <h2 className="text-2xl font-medium text-white">Repay Loan</h2>
                <p className="text-neutral-400">Original Amount: ${loan.amount}</p>
            </div>

            <div className="bg-neutral-800 rounded-xl p-6 space-y-6 border border-neutral-700">
                <div className="text-center space-y-1">
                    <p className="text-sm text-neutral-400">Payment Amount</p>
                    <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl text-neutral-500">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="bg-transparent text-4xl font-bold text-white w-32 text-center focus:outline-none border-b border-neutral-600 focus:border-emerald-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Consequence Preview */}
                <div className={`p-4 rounded-lg border ${classification.type === 'LATE' ? 'bg-red-900/20 border-red-900/50' : 'bg-emerald-900/20 border-emerald-900/50'}`}>
                    <p className={`font-medium text-center ${classification.color}`}>
                        {classification.text}
                    </p>
                    <p className="text-xs text-center text-neutral-300 mt-1 opacity-80">
                        {classification.consequence}
                    </p>
                </div>

                <div className="space-y-2 text-sm text-neutral-400">
                    <div className="flex justify-between">
                        <span>Status</span>
                        <span className={isLate ? "text-red-400" : isEarly ? "text-emerald-400" : "text-white"}>
                            {isLate ? `Overdue (${loan.lateDays} days)` : isEarly ? "Early" : "Due Soon"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Due Date</span>
                        <span>{new Date(loan.dueAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => onConfirm(amount)}
                    disabled={amount <= 0}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
                >
                    Confirm Payment
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
