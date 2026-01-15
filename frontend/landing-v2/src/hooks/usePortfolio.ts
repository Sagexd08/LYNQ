import { useState, useEffect, useCallback } from 'react';
import { portfolioApi } from '@/lib/api/portfolio';
import { UserPortfolio, Transaction } from '@/lib/api/types';

export function usePortfolio() {
    const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPortfolio = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await portfolioApi.getPortfolio();
            setPortfolio(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPortfolio();
    }, [fetchPortfolio]);

    return {
        portfolio,
        isLoading,
        error,
        refresh: fetchPortfolio,
    };
}

export function useAssetBreakdown() {
    const [assets, setAssets] = useState<Array<{
        symbol: string;
        name: string;
        balance: string;
        value: number;
        change: number;
    }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAssets = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await portfolioApi.getAssetBreakdown();
            setAssets(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch assets');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return { assets, isLoading, error, refresh: fetchAssets };
}

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await portfolioApi.getTransactions();
            setTransactions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return { transactions, isLoading, error, refresh: fetchTransactions };
}
