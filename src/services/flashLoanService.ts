import axios from 'axios';
import { APP_CONFIG } from '../config/env';

// Types
export interface FlashLoanQuote {
  assets: string[];
  amounts: string[];
  premiums: string[];
  totalCosts: string[];
  riskLevel: string;
  estimatedGas: string;
  estimatedGasCost: string;
  feeBps: number;
}

export interface EligibilityCheck {
  eligible: boolean;
  reason: string;
  trustScore?: number;
  riskLevel?: string;
  cooldownRemaining?: number;
}

export interface UserStats {
  totalFlashLoans: number;
  successfulFlashLoans: number;
  failedFlashLoans: number;
  totalVolumeFlashLoaned: string;
  riskLevel: string;
  trustScore: number;
  successRate: number;
}

export interface FlashLoanSimulation {
  success: boolean;
  estimatedGas: string;
  estimatedCost: string;
  warnings: string[];
  risks: string[];
}

export interface FlashLoanResult {
  transactionHash: string;
  success: boolean;
  gasUsed: string;
  premiumsPaid: string[];
  timestamp: number;
}

export interface FlashLoanHistory {
  transactions: FlashLoanTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FlashLoanTransaction {
  transactionHash: string;
  timestamp: number;
  assets: string[];
  amounts: string[];
  premiums: string[];
  success: boolean;
  gasUsed: string;
}

export interface RiskAssessment {
  riskLevel: string;
  riskScore: number;
  trustScore: number;
  factors: RiskFactor[];
  recommendations: string[];
  cooldownPeriod: number;
}

export interface RiskFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface LiquidityInfo {
  assets: Array<{
    address: string;
    liquidity: string;
    maxAmount: string;
  }>;
}

// Flash Loan Service
class FlashLoanService {
  private baseURL = `${APP_CONFIG.backendUrl}/api/v1/flash-loans`;

  /**
   * Get flash loan quote
   */
  async getFlashLoanQuote(
    userAddress: string,
    assets: string[],
    amounts: string[]
  ): Promise<FlashLoanQuote> {
    try {
      const response = await axios.post(`${this.baseURL}/quote`, {
        userAddress,
        assets,
        amounts,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to get flash loan quote');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Check eligibility
   */
  async checkEligibility(
    userAddress: string,
    assets: string[],
    amounts: string[]
  ): Promise<EligibilityCheck> {
    try {
      const response = await axios.post(`${this.baseURL}/check-eligibility`, {
        userAddress,
        assets,
        amounts,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to check eligibility');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userAddress: string): Promise<UserStats> {
    try {
      const response = await axios.get(`${this.baseURL}/user/${userAddress}/stats`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to get user stats');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get available liquidity
   */
  async getAvailableLiquidity(): Promise<LiquidityInfo> {
    try {
      const response = await axios.get(`${this.baseURL}/liquidity`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to get available liquidity');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Simulate flash loan execution
   */
  async simulateFlashLoan(
    userAddress: string,
    receiverAddress: string,
    assets: string[],
    amounts: string[],
    params: string
  ): Promise<FlashLoanSimulation> {
    try {
      const response = await axios.post(`${this.baseURL}/simulate`, {
        userAddress,
        receiverAddress,
        assets,
        amounts,
        params,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to simulate flash loan');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Execute flash loan
   */
  async executeFlashLoan(
    userAddress: string,
    receiverAddress: string,
    assets: string[],
    amounts: string[],
    params: string
  ): Promise<FlashLoanResult> {
    try {
      const response = await axios.post(`${this.baseURL}/execute`, {
        userAddress,
        receiverAddress,
        assets,
        amounts,
        params,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to execute flash loan');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get flash loan history
   */
  async getFlashLoanHistory(
    userAddress: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<FlashLoanHistory> {
    try {
      const response = await axios.get(
        `${this.baseURL}/user/${userAddress}/history?limit=${limit}&offset=${offset}`
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to get flash loan history');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get risk assessment
   */
  async getRiskAssessment(userAddress: string): Promise<RiskAssessment> {
    try {
      const response = await axios.get(`${this.baseURL}/user/${userAddress}/risk-assessment`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to get risk assessment');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }
}

export const flashLoanService = new FlashLoanService();
