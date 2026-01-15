import { useState, useCallback } from 'react';
import { collateralApi } from '@/lib/api/collateral';
import { Collateral, LockCollateralRequest, UnlockCollateralRequest } from '@/lib/api/types';
import toast from 'react-hot-toast';

export function useCollateral() {
    const [collaterals, setCollaterals] = useState<Collateral[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCollaterals = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await collateralApi.getCollateralByUser();
            setCollaterals(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch collaterals');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const lockCollateral = useCallback(async (request: LockCollateralRequest) => {
        setIsLocking(true);
        setError(null);
        try {
            const newCollateral = await collateralApi.lockCollateral(request);
            setCollaterals(prev => [...prev, newCollateral]);
            toast.success('Collateral locked successfully');
            return newCollateral;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to lock collateral';
            setError(message);
            toast.error(message);
            throw err;
        } finally {
            setIsLocking(false);
        }
    }, []);

    const unlockCollateral = useCallback(async (request: UnlockCollateralRequest) => {
        setIsUnlocking(true);
        setError(null);
        try {
            const updatedCollateral = await collateralApi.unlockCollateral(request);
            setCollaterals(prev => prev.map(c =>
                c.id === updatedCollateral.id ? updatedCollateral : c
            ));
            toast.success('Collateral unlocked successfully');
            return updatedCollateral;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unlock collateral';
            setError(message);
            toast.error(message);
            throw err;
        } finally {
            setIsUnlocking(false);
        }
    }, []);

    const getTotalValue = useCallback(async () => {
        try {
            const result = await collateralApi.getTotalValue();
            return result.totalValueUsd;
        } catch {
            return 0;
        }
    }, []);

    return {
        collaterals,
        isLoading,
        isLocking,
        isUnlocking,
        error,
        fetchCollaterals,
        lockCollateral,
        unlockCollateral,
        getTotalValue,
    };
}
