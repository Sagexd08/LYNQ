import type { User, Reputation, ReputationEvent, Loan } from './types';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
};

export const api = {
    getUser: async (userId: string): Promise<User> => {
        const res = await fetch(`/users/${userId}`);
        return handleResponse(res);
    },

    createUser: async (phone: string): Promise<User> => {
        const res = await fetch(`/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        return handleResponse(res);
    },

    getReputation: async (userId: string): Promise<Reputation> => {
        const res = await fetch(`/reputation/${userId}`);
        return handleResponse(res);
    },

    getHistory: async (userId: string): Promise<ReputationEvent[]> => {
        const res = await fetch(`/reputation/${userId}/history`);
        return handleResponse(res);
    },

    applyLoan: async (userId: string, amount: number, durationDays: number = 14): Promise<Loan> => {
        const res = await fetch(`/loans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount, durationDays }),
        });
        return handleResponse(res);
    },

    repayLoan: async (loanId: string, amount: number): Promise<any> => {
        const res = await fetch(`/repayments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loanId, amount }),
        });
        return handleResponse(res);
    },
};
