import { ethers } from 'ethers';
import logger from '../utils/logger';

interface FlashLoanQuote {
  assets: string[];
  amounts: string[];
  premiums: string[];
  totalCosts: string[];
  riskLevel: string;
  estimatedGas: string;
  estimatedGasCost: string;
  feeBps: number;
}

interface EligibilityCheck {
  eligible: boolean;
  reason: string;
  trustScore?: number;
  riskLevel?: string;
  cooldownRemaining?: number;
}

interface UserStats {
  totalFlashLoans: number;
  successfulFlashLoans: number;
  failedFlashLoans: number;
  totalVolumeFlashLoaned: string;
  riskLevel: string;
  trustScore: number;
  successRate: number;
}

interface FlashLoanSimulation {
  success: boolean;
  estimatedGas: string;
  estimatedCost: string;
  warnings: string[];
  risks: string[];
}

interface FlashLoanResult {
  transactionHash: string;
  success: boolean;
  gasUsed: string;
  premiumsPaid: string[];
  timestamp: number;
}

interface FlashLoanHistory {
  transactions: FlashLoanTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

interface FlashLoanTransaction {
  transactionHash: string;
  timestamp: number;
  assets: string[];
  amounts: string[];
  premiums: string[];
  success: boolean;
  gasUsed: string;
}

interface RiskAssessment {
  riskLevel: string;
  riskScore: number;
  trustScore: number;
  factors: RiskFactor[];
  recommendations: string[];
  cooldownPeriod: number;
}

interface RiskFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

class FlashLoanService {
  private provider: ethers.JsonRpcProvider;
  private flashLoanContract: ethers.Contract | null = null;
  private contractAddress: string = '';
  
  // Flash Loan Provider ABI
  private readonly flashLoanABI = [
    'function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, bytes calldata params) external',
    'function flashLoanMultiWallet(address receiverContract, address asset, uint256 totalAmount, address[] calldata recipients, uint256[] calldata allocations, bytes calldata params) external returns (uint256)',
    'function getFlashLoanQuote(address[] calldata assets, uint256[] calldata amounts) external view returns (uint256[] memory premiums, uint256[] memory totalCosts, uint8 riskLevel, uint256 estimatedGas)',
    'function getMultiWalletBatch(uint256 batchId) external view returns (tuple(address asset, uint256 totalAmount, uint256 premium, address[] recipients, uint256[] allocations, address initiator, uint256 timestamp, bool success, string failureReason) batch)',
    'function getUserBatchIds(address user) external view returns (uint256[] memory)',
    'function checkEligibility(address user, address[] calldata assets, uint256[] calldata amounts) external view returns (bool eligible, string memory reason)',
    'function getUserStats(address user) external view returns (uint256 totalFlashLoans, uint256 successfulFlashLoans, uint256 failedFlashLoans, uint256 totalVolumeFlashLoaned, uint8 riskLevel, uint256 trustScore)',
    'function getAvailableLiquidity() external view returns (address[] memory assets, uint256[] memory liquidities, uint256[] memory maxAmounts)',
    'function flashLoanFeeBps() external view returns (uint256)',
    'event FlashLoan(address indexed receiver, address indexed initiator, address[] assets, uint256[] amounts, uint256[] premiums, uint256 timestamp)',
    'event FlashLoanFailed(address indexed receiver, address indexed initiator, address[] assets, uint256[] amounts, string reason)',
    'event MultiWalletFlashLoan(uint256 indexed batchId, address indexed initiator, address indexed asset, uint256 totalAmount, uint256 premium, address[] recipients, uint256[] allocations, uint256 timestamp)',
    'event MultiWalletFlashLoanFailed(uint256 indexed batchId, address indexed initiator, address indexed asset, uint256 totalAmount, string failureReason, address[] failedRecipients)',
  ];

  constructor() {
    // Initialize provider
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialize contract if address is available
    this.contractAddress = process.env.FLASH_LOAN_CONTRACT_ADDRESS || '';
    if (this.contractAddress) {
      this.flashLoanContract = new ethers.Contract(
        this.contractAddress,
        this.flashLoanABI,
        this.provider
      );
    }
  }

  /**
   * Get flash loan quote
   */
  async getFlashLoanQuote(
    userAddress: string,
    assets: string[],
    amounts: string[]
  ): Promise<FlashLoanQuote> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      // Get fee
      const feeBps = await this.flashLoanContract.flashLoanFeeBps();

      // Get quote from contract
      const [premiums, totalCosts, riskLevel, estimatedGas] = 
        await this.flashLoanContract.getFlashLoanQuote(assets, amounts);

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      const estimatedGasCost = (BigInt(estimatedGas) * gasPrice).toString();

      // Map risk level
      const riskLevels = ['Low', 'Medium', 'High', 'Critical'];

      return {
        assets,
        amounts: amounts.map(a => a.toString()),
        premiums: premiums.map((p: bigint) => p.toString()),
        totalCosts: totalCosts.map((c: bigint) => c.toString()),
        riskLevel: riskLevels[Number(riskLevel)],
        estimatedGas: estimatedGas.toString(),
        estimatedGasCost,
        feeBps: Number(feeBps),
      };
    } catch (error) {
      logger.error('Error getting flash loan quote', { error, userAddress, assets, amounts });
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
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      const [eligible, reason] = await this.flashLoanContract.checkEligibility(
        userAddress,
        assets,
        amounts
      );

      // Get additional user stats
      const stats = await this.getUserStats(userAddress);

      return {
        eligible,
        reason: reason || (eligible ? 'User is eligible' : 'Unknown reason'),
        trustScore: stats.trustScore,
        riskLevel: stats.riskLevel,
        cooldownRemaining: eligible ? 0 : 3600, // 1 hour in seconds
      };
    } catch (error) {
      logger.error('Error checking eligibility', { error, userAddress, assets, amounts });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userAddress: string): Promise<UserStats> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      const [
        totalFlashLoans,
        successfulFlashLoans,
        failedFlashLoans,
        totalVolumeFlashLoaned,
        riskLevel,
        trustScore,
      ] = await this.flashLoanContract.getUserStats(userAddress);

      const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
      const successRate = Number(totalFlashLoans) > 0
        ? (Number(successfulFlashLoans) / Number(totalFlashLoans)) * 100
        : 0;

      return {
        totalFlashLoans: Number(totalFlashLoans),
        successfulFlashLoans: Number(successfulFlashLoans),
        failedFlashLoans: Number(failedFlashLoans),
        totalVolumeFlashLoaned: totalVolumeFlashLoaned.toString(),
        riskLevel: riskLevels[Number(riskLevel)],
        trustScore: Number(trustScore),
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Error getting user stats', { error, userAddress });
      throw error;
    }
  }

  /**
   * Get available liquidity
   */
  async getAvailableLiquidity(): Promise<{
    assets: Array<{ address: string; liquidity: string; maxAmount: string }>;
  }> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      const [assetAddresses, liquidities, maxAmounts] = 
        await this.flashLoanContract.getAvailableLiquidity();

      const assets = assetAddresses.map((address: string, index: number) => ({
        address,
        liquidity: liquidities[index].toString(),
        maxAmount: maxAmounts[index].toString(),
      }));

      return { assets };
    } catch (error) {
      logger.error('Error getting available liquidity', { error });
      throw error;
    }
  }

  /**
   * Simulate flash loan execution
   */
  async simulateFlashLoan(
    userAddress: string,
    assets: string[],
    amounts: string[]
  ): Promise<FlashLoanSimulation> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      const warnings: string[] = [];
      const risks: string[] = [];

      // Check eligibility
      const eligibility = await this.checkEligibility(userAddress, assets, amounts);
      if (!eligibility.eligible) {
        warnings.push(`Not eligible: ${eligibility.reason}`);
      }

      // Get quote
      const quote = await this.getFlashLoanQuote(userAddress, assets, amounts);

      // Risk warnings based on risk level
      if (quote.riskLevel === 'High' || quote.riskLevel === 'Critical') {
        risks.push(`High risk level detected: ${quote.riskLevel}`);
      }

      // Gas cost warning
      const gasCostEth = Number(ethers.formatEther(quote.estimatedGasCost));
      if (gasCostEth > 0.1) {
        warnings.push(`High gas cost: ${gasCostEth.toFixed(4)} ETH`);
      }

      // Try to estimate gas (simulation)
      let estimatedGas = quote.estimatedGas;
      try {
        // This would call a static simulation in production
        estimatedGas = quote.estimatedGas;
      } catch (error) {
        warnings.push('Gas estimation failed - transaction may fail');
      }

      return {
        success: eligibility.eligible,
        estimatedGas,
        estimatedCost: quote.estimatedGasCost,
        warnings,
        risks,
      };
    } catch (error) {
      logger.error('Error simulating flash loan', { error });
      throw error;
    }
  }

  /**
   * Execute flash loan (returns unsigned transaction data)
   */
  async executeFlashLoan(
    userAddress: string,
    receiverAddress: string,
    assets: string[],
    amounts: string[],
    params: string
  ): Promise<FlashLoanResult> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      // Get the private key from environment variables
      const privateKey = process.env.FLASH_LOAN_OPERATOR_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('Flash loan operator private key not configured');
      }

      // Create a wallet signer
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contractWithSigner = new ethers.Contract(
        this.contractAddress,
        this.flashLoanABI,
        wallet
      );

      logger.info('Executing flash loan transaction', {
        userAddress,
        receiverAddress,
        assets,
        amounts,
      });

      // Convert string amounts to BigInt
      const bigIntAmounts = amounts.map(amount => BigInt(amount));

      // Execute the flash loan
      const tx = await contractWithSigner.flashLoan(
        receiverAddress,
        assets,
        bigIntAmounts,
        params
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Get quote for premium calculation in the response
      const quote = await this.getFlashLoanQuote(userAddress, assets, amounts);

      return {
        transactionHash: receipt.hash,
        success: true,
        gasUsed: receipt.gasUsed.toString(),
        premiumsPaid: quote.premiums,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Error executing flash loan', { error });
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
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      // Query FlashLoan events
      const filter = this.flashLoanContract.filters.FlashLoan(null, userAddress);
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100000); // Last ~2 weeks

      const events = await this.flashLoanContract.queryFilter(filter, fromBlock, currentBlock);

      // Parse events
      const transactions: FlashLoanTransaction[] = await Promise.all(
        events.slice(offset, offset + limit).map(async (event) => {
          const block = await event.getBlock();
          // Cast to any to access args property
          const eventLog: any = event;
          return {
            transactionHash: event.transactionHash,
            timestamp: block.timestamp,
            assets: eventLog.args?.assets || [],
            amounts: (eventLog.args?.amounts || []).map((a: bigint) => a.toString()),
            premiums: (eventLog.args?.premiums || []).map((p: bigint) => p.toString()),
            success: true,
            gasUsed: '0', // Would need to get from transaction receipt
          };
        })
      );

      return {
        transactions,
        total: events.length,
        page: Math.floor(offset / limit),
        pageSize: limit,
      };
    } catch (error) {
      logger.error('Error getting flash loan history', { error, userAddress });
      throw error;
    }
  }

  /**
   * Get risk assessment
   */
  async getRiskAssessment(userAddress: string): Promise<RiskAssessment> {
    try {
      const stats = await this.getUserStats(userAddress);
      
      const factors: RiskFactor[] = [];
      const recommendations: string[] = [];

      // Trust score factor
      if (stats.trustScore >= 700) {
        factors.push({
          factor: 'Trust Score',
          impact: 'positive',
          description: `High trust score: ${stats.trustScore}`,
        });
      } else if (stats.trustScore < 500) {
        factors.push({
          factor: 'Trust Score',
          impact: 'negative',
          description: `Low trust score: ${stats.trustScore}`,
        });
        recommendations.push('Build trust score by completing successful loans');
      }

      // Success rate factor
      if (stats.successRate >= 90) {
        factors.push({
          factor: 'Success Rate',
          impact: 'positive',
          description: `High success rate: ${stats.successRate}%`,
        });
      } else if (stats.successRate < 70) {
        factors.push({
          factor: 'Success Rate',
          impact: 'negative',
          description: `Low success rate: ${stats.successRate}%`,
        });
        recommendations.push('Review flash loan strategies to improve success rate');
      }

      // Experience factor
      if (stats.totalFlashLoans > 10) {
        factors.push({
          factor: 'Experience',
          impact: 'positive',
          description: `${stats.totalFlashLoans} flash loans completed`,
        });
      } else if (stats.totalFlashLoans === 0) {
        factors.push({
          factor: 'Experience',
          impact: 'neutral',
          description: 'No flash loan history',
        });
        recommendations.push('Start with small amounts to build experience');
      }

      // Calculate cooldown based on risk level
      const cooldownPeriods = {
        'Low': 0,
        'Medium': 1800, // 30 minutes
        'High': 3600,   // 1 hour
        'Critical': 86400, // 24 hours
      };

      const cooldownPeriod = cooldownPeriods[stats.riskLevel as keyof typeof cooldownPeriods] || 0;

      // Risk score (0-100)
      const riskScore = Math.max(0, Math.min(100,
        100 - stats.trustScore / 10 + stats.failedFlashLoans * 5 - stats.successRate / 2
      ));

      return {
        riskLevel: stats.riskLevel,
        riskScore: Math.round(riskScore),
        trustScore: stats.trustScore,
        factors,
        recommendations,
        cooldownPeriod,
      };
    } catch (error) {
      logger.error('Error getting risk assessment', { error, userAddress });
      throw error;
    }
  }

  /**
   * Execute a multi-wallet flash loan
   * @param userAddress The user initiating the flash loan
   * @param asset The asset to borrow
   * @param totalAmount Total amount to distribute across recipients
   * @param recipients Array of recipient wallet addresses
   * @param allocations Array of amounts per recipient (must sum to totalAmount)
   * @param receiverContract The contract that will handle distribution and repayment
   * @param params Optional additional parameters
   * @returns Transaction hash and batch ID
   */
  async executeMultiWalletFlashLoan(
    userAddress: string,
    asset: string,
    totalAmount: string,
    recipients: string[],
    allocations: string[],
    receiverContract: string,
    params: string = '0x'
  ): Promise<{ transactionHash: string; batchId: string }> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      // Validate recipients and allocations
      if (recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }
      if (recipients.length !== allocations.length) {
        throw new Error('Recipients and allocations arrays must have the same length');
      }
      if (recipients.length > 20) {
        throw new Error('Maximum 20 recipients allowed');
      }

      // Validate allocations sum to totalAmount
      const allocationSum = allocations.reduce((sum, a) => {
        return sum + BigInt(a);
      }, 0n);

      if (allocationSum !== BigInt(totalAmount)) {
        throw new Error('Allocations must sum to totalAmount');
      }

      // Get signer
      const wallet = ethers.Wallet.fromPhrase(process.env.PRIVATE_KEY || '', this.provider);
      const contract = this.flashLoanContract.connect(wallet) as any;

      // Execute multi-wallet flash loan
      logger.info('Executing multi-wallet flash loan', {
        initiator: userAddress,
        asset,
        totalAmount,
        recipientCount: recipients.length,
        receiver: receiverContract,
      });

      const tx = await contract.flashLoanMultiWallet(
        receiverContract,
        asset,
        ethers.parseUnits(totalAmount, 18), // Assuming 18 decimals
        recipients,
        allocations.map(a => ethers.parseUnits(a, 18)),
        params
      );

      // Wait for transaction
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      // Extract batch ID from event logs (assuming first event is MultiWalletFlashLoan)
      // This would be better handled by parsing specific event, but shown for example
      const batchId = receipt.logs?.[0]?.topics?.[1] || '0';

      logger.info('Multi-wallet flash loan executed successfully', {
        transactionHash: receipt.hash,
        batchId,
        status: receipt.status,
      });

      return {
        transactionHash: receipt.hash,
        batchId: batchId.toString(),
      };
    } catch (error) {
      logger.error('Error executing multi-wallet flash loan', {
        error,
        userAddress,
        asset,
        totalAmount,
      });
      throw error;
    }
  }

  /**
   * Get multi-wallet batch details
   * @param batchId The batch ID to retrieve
   */
  async getMultiWalletBatch(batchId: number): Promise<any> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      const batch = await this.flashLoanContract.getMultiWalletBatch(batchId);

      return {
        asset: batch.asset,
        totalAmount: batch.totalAmount.toString(),
        premium: batch.premium.toString(),
        recipients: batch.recipients,
        allocations: batch.allocations.map((a: bigint) => a.toString()),
        initiator: batch.initiator,
        timestamp: batch.timestamp.toNumber(),
        success: batch.success,
        failureReason: batch.failureReason,
      };
    } catch (error) {
      logger.error('Error getting multi-wallet batch', { error, batchId });
      throw error;
    }
  }

  /**
   * Get all batch IDs for a user
   * @param userAddress The user address
   */
  async getUserMultiWalletBatches(userAddress: string): Promise<number[]> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      const batchIds = await this.flashLoanContract.getUserBatchIds(userAddress);
      return batchIds.map((id: bigint) => Number(id));
    } catch (error) {
      logger.error('Error getting user batches', { error, userAddress });
      throw error;
    }
  }

  /**
   * Get multi-wallet flash loan quote
   * @param asset The asset to borrow
   * @param totalAmount Total amount to distribute
   * @param recipients Number of recipients (for gas estimation)
   */
  async getMultiWalletFlashLoanQuote(
    asset: string,
    totalAmount: string,
    recipientCount: number
  ): Promise<{
    premium: string;
    feeBps: number;
    estimatedGas: string;
    estimatedGasCost: string;
  }> {
    try {
      if (!this.flashLoanContract) {
        throw new Error('Flash loan contract not initialized');
      }

      // Get fee
      const feeBps = await this.flashLoanContract.flashLoanFeeBps();

      // Calculate premium
      const amount = BigInt(totalAmount);
      const premium = (amount * BigInt(feeBps)) / BigInt(10000);

      // Estimate gas (base + per recipient)
      const baseGas = 150000;
      const perRecipientGas = 5000;
      const estimatedGas = baseGas + perRecipientGas * recipientCount;

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      const estimatedGasCost = (BigInt(estimatedGas) * gasPrice).toString();

      return {
        premium: premium.toString(),
        feeBps: Number(feeBps),
        estimatedGas: estimatedGas.toString(),
        estimatedGasCost,
      };
    } catch (error) {
      logger.error('Error getting multi-wallet quote', {
        error,
        asset,
        totalAmount,
        recipientCount,
      });
      throw error;
    }
  }
}

export const flashLoanService = new FlashLoanService();
