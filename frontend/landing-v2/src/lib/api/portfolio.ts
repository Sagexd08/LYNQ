import api from './client';
import {
    UserPortfolio,
    Loan,
    Collateral,
    Transaction,
} from './types';
import { loansApi } from './loans';
import { collateralApi } from './collateral';

export const portfolioApi = {
    async getPortfolio(): Promise<UserPortfolio> {
        const [loansResponse, collateralResponse] = await Promise.all([
            loansApi.getLoans().catch(() => [] as Loan[]),
            collateralApi.getCollateralByUser().catch(() => [] as Collateral[]),
        ]);

        const loans = loansResponse;
        const collaterals = collateralResponse;

        const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');
        const totalBorrowed = loans.reduce((sum, loan) => sum + loan.amount, 0);
        const totalRepaid = loans.reduce((sum, loan) => sum + loan.amountRepaid, 0);

        const totalCollateralValue = collaterals
            .filter(c => c.status === 'LOCKED')
            .reduce((sum, c) => sum + c.valueUsd, 0);

        const activeBorrowAmount = activeLoans.reduce((sum, loan) => sum + (loan.amount - loan.amountRepaid), 0);
        const healthFactor = activeBorrowAmount > 0 ? totalCollateralValue / activeBorrowAmount : 999;

        const maxTotalBorrow = 50000;
        const availableCredit = Math.max(0, maxTotalBorrow - activeBorrowAmount);

        const transactions = await this.getTransactions().catch(() => []);

        return {
            totalValue: totalCollateralValue + availableCredit,
            activeLoans,
            totalBorrowed,
            totalRepaid,
            availableCredit,
            collaterals,
            healthFactor: Math.min(healthFactor, 10),
            riskLevel: Math.max(0, Math.min(100, (1 / healthFactor) * 100)),
            transactions,
        };
    },

    async getTransactions(): Promise<Transaction[]> {
        try {
            const response = await api.get<Transaction[]>('/transactions/user');
            return response.data;
        } catch {
            return [];
        }
    },

    async getAssetBreakdown(): Promise<Array<{
        symbol: string;
        name: string;
        balance: string;
        value: number;
        change: number;
    }>> {
        const collaterals = await collateralApi.getCollateralByUser().catch(() => []);

        const assetMap = new Map<string, { symbol: string; name: string; balance: number; value: number }>();

        for (const collateral of collaterals) {
            const existing = assetMap.get(collateral.tokenSymbol);
            if (existing) {
                existing.balance += collateral.amount;
                existing.value += collateral.valueUsd;
            } else {
                assetMap.set(collateral.tokenSymbol, {
                    symbol: collateral.tokenSymbol,
                    name: collateral.tokenSymbol,
                    balance: collateral.amount,
                    value: collateral.valueUsd,
                });
            }
        }

        return Array.from(assetMap.values()).map(asset => ({
            symbol: asset.symbol,
            name: asset.name,
            balance: `${asset.balance.toFixed(4)} ${asset.symbol}`,
            value: asset.value,
            change: 0,
        }));
    },
};
