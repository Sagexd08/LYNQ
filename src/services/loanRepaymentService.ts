import { TelegramService } from './telegramService';
import { ethers } from 'ethers';


export interface LoanDetails {
  id: string;
  borrower: string;
  principal: string; 
  principalRemaining: string; 
  interestRate: string; 
  interestAccrued: string; 
  lateFine: string; 
  dueDate: number; 
  isOverdue: boolean;
  status: 'ACTIVE' | 'PAID' | 'DEFAULTED';
  tokenAddress: string; 
}

export interface RepaymentCalculation {
  principalRemaining: string;
  interestAccrued: string;
  lateFine: string;
  totalPayable: string;
  canRepayPartial: boolean;
  maxLateFine: string;
}

export interface RepaymentTransaction {
  type: 'PARTIAL' | 'FULL';
  amount: string; 
  breakdown: {
    lateFinePayment: string;
    interestPayment: string;
    principalPayment: string;
  };
}


export const LOAN_CONTRACT_ABI = [
  
  "function getLoanDetails(uint256 loanId) external view returns (tuple(address borrower, uint256 principal, uint256 principalRemaining, uint256 interestRate, uint256 interestAccrued, uint256 lateFine, uint256 dueDate, uint8 status, address tokenAddress))",
  "function calculateRepaymentAmount(uint256 loanId) external view returns (uint256 totalPayable, uint256 lateFine, uint256 interestAccrued, uint256 principalRemaining)",
  "function isLoanOverdue(uint256 loanId) external view returns (bool)",
  "function getMaxLateFine(uint256 loanId) external view returns (uint256)",
  
  
  "function repayLoan(uint256 loanId, uint256 amount) external",
  "function repayLoanFull(uint256 loanId) external",
  "function repayLoanWithToken(uint256 loanId, uint256 amount, address tokenAddress) external",
  
  
  "event PaymentApplied(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 lateFinePayment, uint256 interestPayment, uint256 principalPayment, bool loanClosed)",
  "event LoanClosed(uint256 indexed loanId, address indexed borrower, uint256 timestamp)"
];

export class LoanRepaymentService {
  private contract: ethers.Contract;
  private provider: ethers.BrowserProvider;
  private signer: ethers.Signer | null = null;

  constructor(contractAddress: string, provider: ethers.BrowserProvider) {
    this.provider = provider;
    this.contract = new ethers.Contract(contractAddress, LOAN_CONTRACT_ABI, provider);
  }

  async connectSigner(): Promise<void> {
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(this.contract.target, LOAN_CONTRACT_ABI, this.signer);
  }

  
  async getLoanDetails(loanId: string): Promise<LoanDetails> {
    try {
      const [loanData, isOverdue] = await Promise.all([
        this.contract.getLoanDetails(loanId),
        this.contract.isLoanOverdue(loanId)
      ]);

      return {
        id: loanId,
        borrower: loanData.borrower,
        principal: loanData.principal.toString(),
        principalRemaining: loanData.principalRemaining.toString(),
        interestRate: loanData.interestRate.toString(),
        interestAccrued: loanData.interestAccrued.toString(),
        lateFine: loanData.lateFine.toString(),
        dueDate: Number(loanData.dueDate),
        isOverdue,
        status: this.getStatusFromNumber(loanData.status),
        tokenAddress: loanData.tokenAddress
      };
    } catch (error) {
      console.error('Error fetching loan details:', error);
      throw new Error('Failed to fetch loan details');
    }
  }

  
  async calculateRepaymentAmount(loanId: string): Promise<RepaymentCalculation> {
    try {
      const [repaymentData, maxLateFine] = await Promise.all([
        this.contract.calculateRepaymentAmount(loanId),
        this.contract.getMaxLateFine(loanId)
      ]);

      const lateFine = BigInt(repaymentData.lateFine) > BigInt(maxLateFine) 
        ? maxLateFine.toString() 
        : repaymentData.lateFine.toString();

      const totalPayable = (
        BigInt(repaymentData.principalRemaining) + 
        BigInt(repaymentData.interestAccrued) + 
        BigInt(lateFine)
      ).toString();

      return {
        principalRemaining: repaymentData.principalRemaining.toString(),
        interestAccrued: repaymentData.interestAccrued.toString(),
        lateFine,
        totalPayable,
        canRepayPartial: BigInt(repaymentData.principalRemaining) > 0n,
        maxLateFine: maxLateFine.toString()
      };
    } catch (error) {
      console.error('Error calculating repayment amount:', error);
      throw new Error('Failed to calculate repayment amount');
    }
  }

  
  calculateRepaymentBreakdown(
    paymentAmount: string,
    calculation: RepaymentCalculation
  ): RepaymentTransaction {
    const amount = BigInt(paymentAmount);
    const lateFine = BigInt(calculation.lateFine);
    const interest = BigInt(calculation.interestAccrued);
    const principal = BigInt(calculation.principalRemaining);

    let remaining = amount;
    let lateFinePayment = 0n;
    let interestPayment = 0n;
    let principalPayment = 0n;

    
    
    
    if (remaining > 0n && lateFine > 0n) {
      lateFinePayment = remaining >= lateFine ? lateFine : remaining;
      remaining -= lateFinePayment;
    }

    
    if (remaining > 0n && interest > 0n) {
      interestPayment = remaining >= interest ? interest : remaining;
      remaining -= interestPayment;
    }

    
    if (remaining > 0n && principal > 0n) {
      principalPayment = remaining >= principal ? principal : remaining;
      remaining -= principalPayment;
    }

    
    if (remaining > 0n) {
      throw new Error('Payment amount exceeds total debt. Overpayment not allowed.');
    }

    const isFullPayment = 
      lateFinePayment === lateFine && 
      interestPayment === interest && 
      principalPayment === principal;

    return {
      type: isFullPayment ? 'FULL' : 'PARTIAL',
      amount: paymentAmount,
      breakdown: {
        lateFinePayment: lateFinePayment.toString(),
        interestPayment: interestPayment.toString(),
        principalPayment: principalPayment.toString()
      }
    };
  }

  
  async executePartialRepayment(
    loanId: string, 
    amount: string, 
    tokenAddress?: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    try {
      let tx: ethers.ContractTransactionResponse;

      if (tokenAddress && tokenAddress !== ethers.ZeroAddress) {
        
        tx = await this.contract.repayLoanWithToken(loanId, amount, tokenAddress);
      } else {
        
        tx = await this.contract.repayLoan(loanId, amount, {
          value: amount
        });
      }

      return tx;
    } catch (error) {
      console.error('Error executing partial repayment:', error);
      throw new Error('Failed to execute partial repayment');
    }
  }

  
  async executeFullRepayment(loanId: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    try {
      const calculation = await this.calculateRepaymentAmount(loanId);
      const tx = await this.contract.repayLoanFull(loanId, {
        value: calculation.totalPayable
      });

      return tx;
    } catch (error) {
      console.error('Error executing full repayment:', error);
      throw new Error('Failed to execute full repayment');
    }
  }

  
  onPaymentApplied(
    callback: (event: {
      loanId: string;
      borrower: string;
      amount: string;
      breakdown: RepaymentTransaction['breakdown'];
      loanClosed: boolean;
    }) => void
  ): void {
    this.contract.on('PaymentApplied', (
      loanId: any,
      borrower: string,
      amount: any,
      lateFinePayment: any,
      interestPayment: any,
      principalPayment: any,
      loanClosed: boolean
    ) => {
      callback({
        loanId: loanId.toString(),
        borrower,
        amount: amount.toString(),
        breakdown: {
          lateFinePayment: lateFinePayment.toString(),
          interestPayment: interestPayment.toString(),
          principalPayment: principalPayment.toString()
        },
        loanClosed
      });

      
      try {
        if (TelegramService.isConfigured()) {
          const amountDisplay = ethers.formatEther(amount);
          const late = ethers.formatEther(lateFinePayment);
          const intr = ethers.formatEther(interestPayment);
          const princ = ethers.formatEther(principalPayment);
          void TelegramService.notifyPaymentApplied({
            loanId: loanId.toString(),
            borrower,
            amountDisplay: `${amountDisplay} ETH`,
            lateFine: late !== '0.0' ? `${late} ETH` : undefined,
            interest: intr !== '0.0' ? `${intr} ETH` : undefined,
            principal: princ !== '0.0' ? `${princ} ETH` : undefined,
            closed: Boolean(loanClosed)
          });
        }
      } catch {
        
      }
    });
  }

  
  validateRepaymentAmount(amount: string, calculation: RepaymentCalculation): {
    isValid: boolean;
    error?: string;
  } {
    const amountBN = BigInt(amount);
    const totalPayableBN = BigInt(calculation.totalPayable);

    if (amountBN <= 0n) {
      return { isValid: false, error: 'Payment amount must be greater than 0' };
    }

    if (amountBN > totalPayableBN) {
      return { isValid: false, error: 'Payment amount exceeds total debt' };
    }

    
    const lateFine = BigInt(calculation.lateFine);
    if (lateFine > 0n && amountBN < lateFine) {
      return { 
        isValid: false, 
        error: `Minimum payment of ${ethers.formatEther(lateFine)} ETH required to cover late fine` 
      };
    }

    return { isValid: true };
  }

  
  formatDisplayAmounts(calculation: RepaymentCalculation, decimals: number = 18) {
    return {
      principalRemaining: ethers.formatUnits(calculation.principalRemaining, decimals),
      interestAccrued: ethers.formatUnits(calculation.interestAccrued, decimals),
      lateFine: ethers.formatUnits(calculation.lateFine, decimals),
      totalPayable: ethers.formatUnits(calculation.totalPayable, decimals)
    };
  }

  private getStatusFromNumber(status: number): LoanDetails['status'] {
    switch (status) {
      case 0: return 'ACTIVE';
      case 1: return 'PAID';
      case 2: return 'DEFAULTED';
      default: return 'ACTIVE';
    }
  }
}


export const handleTokenDecimals = {
  
  parseAmount: (amount: string, decimals: number): string => {
    try {
      return ethers.parseUnits(amount, decimals).toString();
    } catch {
      throw new Error('Invalid amount format');
    }
  },

  
  formatAmount: (amount: string, decimals: number): string => {
    try {
      return ethers.formatUnits(amount, decimals);
    } catch {
      return '0';
    }
  },

  
  getTokenDecimals: async (tokenAddress: string, provider: ethers.Provider): Promise<number> => {
    if (tokenAddress === ethers.ZeroAddress) return 18; 

    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function decimals() view returns (uint8)'],
      provider
    );

    try {
      return await tokenContract.decimals();
    } catch {
      return 18; 
    }
  }
};
