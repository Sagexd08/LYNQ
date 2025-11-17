import { Request, Response } from 'express';
import logger from '../utils/logger';
import { flashLoanService } from '../services/flashLoanService';
import { RiskEngine, FlashLoanContext, WalletHistory } from '../services/riskEngine';
import { io } from '../server';

export const flashLoanController = {
  /**
   * Get flash loan quote
   */
  async getQuote(req: Request, res: Response): Promise<void> {
    try {
      const { assets, amounts, userAddress } = req.body;

      if (!assets || !amounts || !userAddress) {
        res.status(400).json({
          error: 'Missing required fields: assets, amounts, userAddress',
        });
        return;
      }

      if (!Array.isArray(assets) || !Array.isArray(amounts)) {
        res.status(400).json({
          error: 'Assets and amounts must be arrays',
        });
        return;
      }

      if (assets.length !== amounts.length) {
        res.status(400).json({
          error: 'Assets and amounts arrays must have the same length',
        });
        return;
      }

      const quote = await flashLoanService.getFlashLoanQuote(
        userAddress,
        assets,
        amounts
      );

      res.json({
        success: true,
        data: quote,
      });
    } catch (error) {
      logger.error('Error getting flash loan quote', { error });
      res.status(500).json({
        error: 'Failed to get flash loan quote',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Check user eligibility for flash loan
   */
  async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress, assets, amounts } = req.body;

      if (!userAddress || !assets || !amounts) {
        res.status(400).json({
          error: 'Missing required fields: userAddress, assets, amounts',
        });
        return;
      }

      const eligibility = await flashLoanService.checkEligibility(
        userAddress,
        assets,
        amounts
      );

      res.json({
        success: true,
        data: eligibility,
      });
    } catch (error) {
      logger.error('Error checking flash loan eligibility', { error });
      res.status(500).json({
        error: 'Failed to check eligibility',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get user flash loan statistics
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;

      if (!userAddress) {
        res.status(400).json({
          error: 'User address is required',
        });
        return;
      }

      const stats = await flashLoanService.getUserStats(userAddress);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting user flash loan stats', { error });
      res.status(500).json({
        error: 'Failed to get user stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get available liquidity for all supported assets
   */
  async getAvailableLiquidity(req: Request, res: Response): Promise<void> {
    try {
      const liquidity = await flashLoanService.getAvailableLiquidity();

      res.json({
        success: true,
        data: liquidity,
      });
    } catch (error) {
      logger.error('Error getting available liquidity', { error });
      res.status(500).json({
        error: 'Failed to get available liquidity',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Simulate flash loan execution
   */
  async simulateFlashLoan(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress, receiverAddress, assets, amounts, params } = req.body;

      if (!userAddress || !receiverAddress || !assets || !amounts) {
        res.status(400).json({
          error: 'Missing required fields',
        });
        return;
      }

      const simulation = await flashLoanService.simulateFlashLoan(
        userAddress,
        receiverAddress,
        assets,
        amounts,
        params || '0x'
      );

      res.json({
        success: true,
        data: simulation,
      });
    } catch (error) {
      logger.error('Error simulating flash loan', { error });
      res.status(500).json({
        error: 'Failed to simulate flash loan',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Execute flash loan
   */
  async executeFlashLoan(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress, receiverAddress, assets, amounts, params } = req.body;

      if (!userAddress || !receiverAddress || !assets || !amounts) {
        res.status(400).json({
          error: 'Missing required fields',
        });
        return;
      }

      // Check eligibility first
      const eligibility = await flashLoanService.checkEligibility(
        userAddress,
        assets,
        amounts
      );

      if (!eligibility.eligible) {
        res.status(403).json({
          error: 'User not eligible for flash loan',
          reason: eligibility.reason,
        });
        return;
      }

      const result = await flashLoanService.executeFlashLoan(
        userAddress,
        receiverAddress,
        assets,
        amounts,
        params || '0x'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error executing flash loan', { error });
      res.status(500).json({
        error: 'Failed to execute flash loan',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get flash loan history for user
   */
  async getFlashLoanHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      if (!userAddress) {
        res.status(400).json({
          error: 'User address is required',
        });
        return;
      }

      const history = await flashLoanService.getFlashLoanHistory(
        userAddress,
        Number(limit),
        Number(offset)
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error getting flash loan history', { error });
      res.status(500).json({
        error: 'Failed to get flash loan history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get risk assessment for user
   */
  async getRiskAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;

      if (!userAddress) {
        res.status(400).json({
          error: 'User address is required',
        });
        return;
      }

      const riskAssessment = await flashLoanService.getRiskAssessment(userAddress);

      res.json({
        success: true,
        data: riskAssessment,
      });
    } catch (error) {
      logger.error('Error getting risk assessment', { error });
      res.status(500).json({
        error: 'Failed to get risk assessment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Assess risk for a proposed multi-wallet flash loan
   */
  async assessMultiWalletRisk(req: Request, res: Response): Promise<void> {
    try {
      const {
        initiator,
        asset,
        totalAmount,
        recipients,
        allocations,
        receiverContract,
      } = req.body;

      // Validation
      if (!initiator || !asset || !totalAmount || !recipients || !allocations || !receiverContract) {
        res.status(400).json({
          error: 'Missing required fields',
        });
        return;
      }

      // Build context for risk engine
      const context: FlashLoanContext = {
        asset,
        totalAmount: BigInt(totalAmount),
        premium: BigInt(totalAmount) / BigInt(20000), // Default 5 bps
        recipientCount: recipients.length,
        recipients,
        allocations: allocations.map((a: string) => BigInt(a)),
        initiator,
        receiverContract,
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Mock wallet histories (in production, would fetch from blockchain indexer)
      const walletHistories = new Map<string, WalletHistory>();

      // Perform risk assessment
      const assessment = await RiskEngine.assessRisk(context, walletHistories);

      logger.info('Risk assessment completed', {
        initiator,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        recommendation: assessment.recommendation,
      });

      res.json({
        success: true,
        data: {
          ...assessment,
          initiator,
          asset,
          totalAmount,
          recipientCount: recipients.length,
        },
      });
    } catch (error) {
      logger.error('Error assessing multi-wallet risk', { error });
      res.status(500).json({
        error: 'Failed to assess risk',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Execute a multi-wallet flash loan
   */
  async executeMultiWalletFlashLoan(req: Request, res: Response): Promise<void> {
    try {
      const {
        initiator,
        asset,
        totalAmount,
        recipients,
        allocations,
        receiverContract,
        params,
      } = req.body;

      // Validation
      if (!initiator || !asset || !totalAmount || !recipients || !allocations || !receiverContract) {
        res.status(400).json({
          error: 'Missing required fields: initiator, asset, totalAmount, recipients, allocations, receiverContract',
        });
        return;
      }

      if (!Array.isArray(recipients) || !Array.isArray(allocations)) {
        res.status(400).json({
          error: 'Recipients and allocations must be arrays',
        });
        return;
      }

      if (recipients.length !== allocations.length) {
        res.status(400).json({
          error: 'Recipients and allocations arrays must have the same length',
        });
        return;
      }

      if (recipients.length === 0 || recipients.length > 20) {
        res.status(400).json({
          error: 'Recipients count must be between 1 and 20',
        });
        return;
      }

      // Validate allocations sum to totalAmount
      const allocationSum = allocations.reduce((sum: string, a: string) => {
        return (BigInt(sum) + BigInt(a)).toString();
      }, '0');

      if (allocationSum !== totalAmount) {
        res.status(400).json({
          error: 'Allocations must sum to totalAmount',
        });
        return;
      }

      // Preflight AI risk assessment
      const riskContext: FlashLoanContext = {
        asset,
        totalAmount: BigInt(totalAmount),
        premium: BigInt(totalAmount) / 2000n, // assume 5 bps default
        recipientCount: recipients.length,
        recipients,
        allocations: allocations.map((a: string) => BigInt(a)),
        initiator,
        receiverContract,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const histories = new Map<string, WalletHistory>();
      const assessment = await RiskEngine.assessRisk(riskContext, histories);

      // Broadcast risk warnings/blocks
      try {
        if (assessment.recommendation === 'BLOCK') {
          io.to(`wallet:${initiator}`).emit('flashloan_risk_blocked', {
            initiator,
            asset,
            totalAmount,
            assessment,
          });
        } else if (assessment.recommendation === 'WARN') {
          io.to(`wallet:${initiator}`).emit('flashloan_risk_warning', {
            initiator,
            asset,
            totalAmount,
            assessment,
          });
        }
      } catch (e) {
        logger.warn('Websocket emit failed for risk broadcast', { error: (e as any)?.message });
      }

      // Enforce policy; allow admin override via req.userRoles + body.override === true
      const adminOverride = Array.isArray((req as any).userRoles) && (req as any).userRoles.includes('admin') && Boolean(req.body?.override);
      if (assessment.recommendation === 'BLOCK' && !adminOverride) {
        res.status(403).json({
          error: 'High risk operation blocked by policy',
          data: {
            score: assessment.riskScore,
            level: assessment.riskLevel,
            reasons: assessment.reasons,
            suggestions: assessment.suggestions || [],
            flags: assessment.flags,
          },
        });
        return;
      }

      logger.audit?.({
        action: 'FLASHLOAN_PREFLIGHT',
        outcome: assessment.recommendation,
        resource: 'flashloan:multi',
        metadata: {
          initiator,
          asset,
          totalAmount,
          recipientCount: recipients.length,
          risk: {
            score: assessment.riskScore,
            level: assessment.riskLevel,
            flags: assessment.flags,
            reasons: assessment.reasons,
            suggestions: assessment.suggestions,
          },
          adminOverride,
        },
      });

      logger.info('Executing multi-wallet flash loan', {
        initiator,
        asset,
        totalAmount,
        recipientCount: recipients.length,
      });

      const result = await flashLoanService.executeMultiWalletFlashLoan(
        initiator,
        asset,
        totalAmount,
        recipients,
        allocations,
        receiverContract,
        params || '0x'
      );

      try {
        io.to(`wallet:${initiator}`).emit('flashloan_executed', {
          initiator,
          asset,
          totalAmount,
          result,
        });
      } catch (e) {
        logger.warn('Websocket emit failed for execution broadcast', { error: (e as any)?.message });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error executing multi-wallet flash loan', { error });
      res.status(500).json({
        error: 'Failed to execute multi-wallet flash loan',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get multi-wallet batch details
   */
  async getMultiWalletBatch(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;

      if (!batchId) {
        res.status(400).json({
          error: 'Batch ID is required',
        });
        return;
      }

      const batch = await flashLoanService.getMultiWalletBatch(parseInt(batchId, 10));

      res.json({
        success: true,
        data: batch,
      });
    } catch (error) {
      logger.error('Error getting multi-wallet batch', { error });
      res.status(500).json({
        error: 'Failed to get batch details',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get all multi-wallet batches for a user
   */
  async getUserMultiWalletBatches(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;

      if (!userAddress) {
        res.status(400).json({
          error: 'User address is required',
        });
        return;
      }

      const batchIds = await flashLoanService.getUserMultiWalletBatches(userAddress);

      // Fetch details for all batches
      const batches = await Promise.all(
        batchIds.map(id => flashLoanService.getMultiWalletBatch(id))
      );

      res.json({
        success: true,
        data: {
          batches,
          totalCount: batches.length,
          userAddress,
        },
      });
    } catch (error) {
      logger.error('Error getting user multi-wallet batches', { error });
      res.status(500).json({
        error: 'Failed to get user batches',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get multi-wallet flash loan quote
   */
  async getMultiWalletQuote(req: Request, res: Response): Promise<void> {
    try {
      const { asset, totalAmount, recipientCount } = req.body;

      if (!asset || !totalAmount || recipientCount === undefined) {
        res.status(400).json({
          error: 'Missing required fields: asset, totalAmount, recipientCount',
        });
        return;
      }

      if (recipientCount < 1 || recipientCount > 20) {
        res.status(400).json({
          error: 'Recipient count must be between 1 and 20',
        });
        return;
      }

      const quote = await flashLoanService.getMultiWalletFlashLoanQuote(
        asset,
        totalAmount,
        recipientCount
      );

      res.json({
        success: true,
        data: quote,
      });
    } catch (error) {
      logger.error('Error getting multi-wallet flash loan quote', { error });
      res.status(500).json({
        error: 'Failed to get quote',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};
