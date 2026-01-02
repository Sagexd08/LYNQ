import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, LOAN_CORE_ABI, ERC20_ABI } from '../config/contracts';
import { getProvider } from './blockchain';
import toast from 'react-hot-toast';

export class ContractService {

    private addresses: typeof CONTRACT_ADDRESSES['mantle'];

    constructor() {

        
        this.addresses = CONTRACT_ADDRESSES.mantleSepolia;
    }

    private async getSigner(): Promise<ethers.Signer> {
        if (!window.ethereum) {
            throw new Error('No crypto wallet found. Please install MetaMask.');
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        return await provider.getSigner();
    }

    async repayLoan(loanId: string, amount: string, tokenAddress: string): Promise<string> {
        try {
            const signer = await this.getSigner();
            const userAddress = await signer.getAddress();

            
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
            const loanCoreAddress = this.addresses.LoanCore;

            const parsedAmount = ethers.parseUnits(amount, 18); 
            const allowance = await (tokenContract as any).allowance(userAddress, loanCoreAddress);

            if (allowance < parsedAmount) {
                toast.loading('Approving token transfer...', { id: 'approve' });
                const approveTx = await (tokenContract as any).approve(loanCoreAddress, parsedAmount);
                await approveTx.wait();
                toast.success('Token approval successful!', { id: 'approve' });
            }

            
            const loanCoreContract = new ethers.Contract(loanCoreAddress, LOAN_CORE_ABI, signer);

            toast.loading('Processing repayment...', { id: 'repay' });
            const tx = await (loanCoreContract as any).repay(loanId, parsedAmount);

            toast.loading('Waiting for confirmation...', { id: 'repay' });
            await tx.wait();

            toast.success('Loan repaid successfully!', { id: 'repay' });
            return tx.hash;

        } catch (error: any) {
            console.error('Repayment failed:', error);
            const message = error.reason || error.message || 'Transaction failed';
            toast.error(`Repayment failed: ${message}`, { id: 'repay' });
            throw error;
        }
    }

    async getLoanDetails(loanId: string) {
        const provider = getProvider('mantleSepolia');
        const loanCore = new ethers.Contract(this.addresses.LoanCore, LOAN_CORE_ABI, provider);

        try {
            const loan = await (loanCore as any).getLoan(loanId);
            return {
                amount: ethers.formatUnits(loan.amount, 18),
                collateral: ethers.formatUnits(loan.collateral, 18),
                interestRate: Number(loan.interestRate) / 100,
                dueDate: new Date(Number(loan.dueDate) * 1000).toLocaleDateString(),
                status: loan.status
            };
        } catch (error) {
            console.error('Failed to fetch loan details:', error);
            return null;
        }
    }
    async createLoan(amount: string, collateralAmount: string, collateralTokenAddress: string): Promise<{ txHash: string; loanId: string | null }> {
        try {
            const signer = await this.getSigner();
            const userAddress = await signer.getAddress();
            const loanCoreAddress = this.addresses.LoanCore;

            
            const collateralToken = new ethers.Contract(collateralTokenAddress, ERC20_ABI, signer);
            const parsedCollateral = ethers.parseUnits(collateralAmount, 18);

            const allowance = await (collateralToken as any).allowance(userAddress, loanCoreAddress);

            if (allowance < parsedCollateral) {
                toast.loading('Approving collateral...', { id: 'create_loan' });
                const approveTx = await (collateralToken as any).approve(loanCoreAddress, parsedCollateral);
                await approveTx.wait();
                toast.success('Collateral approved!', { id: 'create_loan' });
            }

            
            const loanCoreContract = new ethers.Contract(loanCoreAddress, LOAN_CORE_ABI, signer);
            const parsedAmount = ethers.parseUnits(amount, 18); 

            toast.loading('Creating loan request...', { id: 'create_loan' });
            const tx = await (loanCoreContract as any).createLoan(parsedAmount, parsedCollateral, collateralTokenAddress);
            toast.loading('Waiting for confirmation...', { id: 'create_loan' });

            const receipt = await tx.wait();
            let loanId = null;

            
            if (receipt && receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        const parsed = loanCoreContract.interface.parseLog(log);
                        if (parsed && parsed.name === 'LoanCreated') {
                            loanId = parsed.args[0].toString();
                            break;
                        }
                    } catch (e) {
                        
                    }
                }
            }

            toast.success('Loan created successfully!', { id: 'create_loan' });
            return { txHash: tx.hash, loanId };

        } catch (error: any) {
            console.error('Loan creation failed:', error);
            const message = error.reason || error.message || 'Transaction failed';
            toast.error(`Loan creation failed: ${message}`, { id: 'create_loan' });
            throw error;
        }
    }
    async getUserLoans(userAddress: string) {
        try {
            const provider = getProvider('mantleSepolia');
            const loanCore = new ethers.Contract(this.addresses.LoanCore, LOAN_CORE_ABI, provider);

            
            const filter = (loanCore as any).filters.LoanCreated(null, userAddress);
            
            
            const events = await loanCore.queryFilter(filter, -10000);

            const loans = await Promise.all(events.map(async (event: any) => {
                try {
                    const loanId = event.args[0];
                    const loanData = await (loanCore as any).getLoan(loanId);

                    return {
                        id: loanId.toString(),
                        amount: ethers.formatUnits(loanData.amount || 0, 18), 
                        collateral: ethers.formatUnits(loanData.collateral || 0, 18),
                        interestRate: Number(loanData.interestRate || 0) / 100, 
                        dueDate: new Date(Number(loanData.dueDate) * 1000).toLocaleDateString(),
                        status: this.mapStatus(Number(loanData.status)),
                        rawStatus: Number(loanData.status),
                        assetAddress: CONTRACT_ADDRESSES.mantleSepolia.StableToken, 
                    };
                } catch (e) {
                    console.error(`Error fetching loan ${event.args[0]}:`, e);
                    return null;
                }
            }));

            return loans.filter(l => l !== null);
        } catch (error) {
            console.error('Failed to get user loans:', error);
            return [];
        }
    }

    private mapStatus(status: number): 'pending' | 'active' | 'repaid' | 'defaulted' | 'liquidated' {
        const STATUS_MAP = ['pending', 'active', 'repaid', 'defaulted', 'liquidated'] as const;
        return STATUS_MAP[status] || 'pending';
    }

    async refinanceLoan(
        loanId: string,
        params: {
            newInterestRate: number;
            newDuration: number;
            timestamp: number;
            nonce: number;
            signature: string;
        }
    ): Promise<string> {
        try {
            const signer = await this.getSigner();
            const loanCoreContract = new ethers.Contract(this.addresses.LoanCore, LOAN_CORE_ABI, signer);

            toast.loading('Processing refinance...', { id: 'refinance' });

            const tx = await (loanCoreContract as any).refinanceLoan(
                loanId,
                params.newInterestRate,
                params.newDuration,
                params.timestamp,
                params.signature
            );

            toast.loading('Waiting for confirmation...', { id: 'refinance' });
            await tx.wait();

            toast.success('Loan refinanced successfully!', { id: 'refinance' });
            return tx.hash;
        } catch (error: any) {
            console.error('Refinance failed:', error);
            const message = error.reason || error.message || 'Transaction failed';
            toast.error(`Refinance failed: ${message}`, { id: 'refinance' });
            throw error;
        }
    }
}

export const contractService = new ContractService();
