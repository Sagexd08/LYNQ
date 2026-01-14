import { useState, useCallback, useMemo } from 'react';
import { ethers, Contract } from 'ethers';
import { useWallet } from './useWallet';

const LOAN_CORE_ABI = [
    'function createLoan(uint256 amount, uint256 interestRate, uint256 termDays) external returns (bytes32)',
    'function repay(bytes32 loanId) external payable',
    'function calculateTotalOwed(bytes32 loanId) external view returns (uint256)',
    'function getLoan(bytes32 loanId) external view returns (tuple(bytes32 loanId, address borrower, uint256 amount, uint256 interestRate, uint256 termDays, uint256 createdAt, uint256 dueDate, uint256 amountRepaid, uint8 status))',
    'function isOverdue(bytes32 loanId) external view returns (bool)',
    'event LoanCreated(bytes32 indexed loanId, address indexed borrower, uint256 amount, uint256 interestRate, uint256 termDays, uint256 dueDate)',
    'event LoanRepaid(bytes32 indexed loanId, uint256 timestamp)',
];

const COLLATERAL_VAULT_ABI = [
    'function lockCollateral(bytes32 loanId, address token, uint256 amount) external',
    'function getCollateral(bytes32 loanId) external view returns (tuple(bytes32 loanId, address depositor, address token, uint256 amount, bool isLocked)[])',
    'event CollateralLocked(bytes32 indexed loanId, address indexed depositor, address indexed token, uint256 amount, uint256 index)',
];

export interface CreateLoanOnChainParams {
    amount: number;
    interestRateBps: number;
    termDays: number;
}

export interface OnChainLoan {
    loanId: string;
    borrower: string;
    amount: string;
    interestRate: number;
    termDays: number;
    createdAt: number;
    dueDate: number;
    amountRepaid: string;
    status: number;
}

export function useLoanContract() {
    const { signer, isConnected } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loanCoreAddress = import.meta.env.VITE_LOAN_CORE_ADDRESS;
    const collateralVaultAddress = import.meta.env.VITE_COLLATERAL_VAULT_ADDRESS;

    const loanCoreContract = useMemo(() => {
        if (!signer || !loanCoreAddress) return null;
        return new Contract(loanCoreAddress, LOAN_CORE_ABI, signer);
    }, [signer, loanCoreAddress]);

    const collateralVaultContract = useMemo(() => {
        if (!signer || !collateralVaultAddress) return null;
        return new Contract(collateralVaultAddress, COLLATERAL_VAULT_ABI, signer);
    }, [signer, collateralVaultAddress]);

    const createLoanOnChain = useCallback(
        async (params: CreateLoanOnChainParams): Promise<{ txHash: string; loanId: string } | null> => {
            if (!loanCoreContract || !isConnected) {
                setError('Wallet not connected or contract not available');
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const amountInWei = ethers.parseEther(params.amount.toString());

                const tx = await loanCoreContract.createLoan(
                    amountInWei,
                    params.interestRateBps,
                    params.termDays
                );

                const receipt = await tx.wait();

                const loanCreatedEvent = receipt.logs.find((log: any) => {
                    try {
                        const parsed = loanCoreContract.interface.parseLog(log);
                        return parsed?.name === 'LoanCreated';
                    } catch {
                        return false;
                    }
                });

                let loanId = '';
                if (loanCreatedEvent) {
                    const parsed = loanCoreContract.interface.parseLog(loanCreatedEvent);
                    loanId = parsed?.args?.[0] || '';
                }

                setIsLoading(false);
                return {
                    txHash: receipt.hash,
                    loanId,
                };
            } catch (err: any) {
                setIsLoading(false);
                setError(err.message || 'Failed to create loan on-chain');
                return null;
            }
        },
        [loanCoreContract, isConnected]
    );

    const repayLoanOnChain = useCallback(
        async (loanId: string, amountWei: bigint): Promise<string | null> => {
            if (!loanCoreContract || !isConnected) {
                setError('Wallet not connected or contract not available');
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const tx = await loanCoreContract.repay(loanId, { value: amountWei });
                const receipt = await tx.wait();

                setIsLoading(false);
                return receipt.hash;
            } catch (err: any) {
                setIsLoading(false);
                setError(err.message || 'Failed to repay loan on-chain');
                return null;
            }
        },
        [loanCoreContract, isConnected]
    );

    const getLoanFromChain = useCallback(
        async (loanId: string): Promise<OnChainLoan | null> => {
            if (!loanCoreContract) {
                setError('Contract not available');
                return null;
            }

            try {
                const loan = await loanCoreContract.getLoan(loanId);

                return {
                    loanId: loan.loanId,
                    borrower: loan.borrower,
                    amount: ethers.formatEther(loan.amount),
                    interestRate: Number(loan.interestRate),
                    termDays: Number(loan.termDays),
                    createdAt: Number(loan.createdAt),
                    dueDate: Number(loan.dueDate),
                    amountRepaid: ethers.formatEther(loan.amountRepaid),
                    status: Number(loan.status),
                };
            } catch (err: any) {
                setError(err.message || 'Failed to get loan from chain');
                return null;
            }
        },
        [loanCoreContract]
    );

    const getTotalOwed = useCallback(
        async (loanId: string): Promise<string | null> => {
            if (!loanCoreContract) {
                setError('Contract not available');
                return null;
            }

            try {
                const totalOwed = await loanCoreContract.calculateTotalOwed(loanId);
                return ethers.formatEther(totalOwed);
            } catch (err: any) {
                setError(err.message || 'Failed to calculate total owed');
                return null;
            }
        },
        [loanCoreContract]
    );

    const lockCollateral = useCallback(
        async (loanId: string, tokenAddress: string, amount: bigint): Promise<string | null> => {
            if (!collateralVaultContract || !isConnected) {
                setError('Wallet not connected or contract not available');
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const tx = await collateralVaultContract.lockCollateral(loanId, tokenAddress, amount);
                const receipt = await tx.wait();

                setIsLoading(false);
                return receipt.hash;
            } catch (err: any) {
                setIsLoading(false);
                setError(err.message || 'Failed to lock collateral');
                return null;
            }
        },
        [collateralVaultContract, isConnected]
    );

    return {
        isLoading,
        error,
        isContractAvailable: !!loanCoreContract,
        createLoanOnChain,
        repayLoanOnChain,
        getLoanFromChain,
        getTotalOwed,
        lockCollateral,
        clearError: () => setError(null),
    };
}
