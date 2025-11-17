import { Router, Request, Response } from 'express';
import { z } from 'zod';
import LoanService, { LoanStatus } from '../services/loanService';

/**
 * Loan Management API Routes - Phase 3
 * Handles loan products, applications, accounts, EMI, and repayments
 */

const loanMgmtRouter = Router();

// Validation Schemas
const CalculateEMISchema = z.object({
  principal: z.number().positive('Principal must be positive'),
  annualRate: z.number().min(0, 'Annual rate cannot be negative'),
  tenure: z.number().int().positive('Tenure must be positive')
});

const ApplyLoanSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  productId: z.string().min(1, 'Product ID required'),
  amount: z.number().positive('Amount must be positive'),
  tenure: z.number().int().positive('Tenure must be positive'),
  purpose: z.string().optional(),
  employmentType: z.enum(['EMPLOYED', 'SELF_EMPLOYED', 'BUSINESS', 'OTHER']),
  annualIncome: z.number().positive('Annual income must be positive'),
  existingLoans: z.number().nonnegative('Existing loans cannot be negative').optional()
});

const RepaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'WALLET', 'CARD', 'CRYPTO']),
  referenceId: z.string().min(1, 'Reference ID required')
});

/**
 * GET /api/loans/products
 * Get all available loan products
 */
loanMgmtRouter.get('/products', (_req: Request, res: Response) => {
  try {
    const products = LoanService.getAvailableProducts();
    res.json({
      success: true,
      data: {
        products,
        total: products.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/loans/products/:productId
 * Get specific loan product details
 */
loanMgmtRouter.get('/products/:productId', (req: Request, res: Response) => {
  try {
    const product = LoanService.getProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

/**
 * POST /api/loans/calculate-emi
 * Calculate EMI for given parameters
 */
loanMgmtRouter.post('/calculate-emi', (req: Request, res: Response) => {
  try {
    const validatedData = CalculateEMISchema.parse(req.body);
    const { principal, annualRate, tenure } = validatedData;

    const emi = LoanService.calculateEMI(principal, annualRate, tenure);
    const summary = LoanService.calculateLoanSummary(principal, annualRate, tenure, 0);

    res.json({
      success: true,
      data: {
        emi: Math.round(emi * 100) / 100,
        ...summary
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to calculate EMI'
    });
  }
});

/**
 * POST /api/loans/calculate-amortization
 * Generate complete amortization schedule
 */
loanMgmtRouter.post('/calculate-amortization', (req: Request, res: Response) => {
  try {
    const validatedData = CalculateEMISchema.parse(req.body);
    const { principal, annualRate, tenure } = validatedData;

    const startDate = new Date();
    const schedule = LoanService.generateAmortizationSchedule(
      principal,
      annualRate,
      tenure,
      startDate
    );

    res.json({
      success: true,
      data: {
        schedule,
        total: schedule.length,
        emi: schedule[0]?.amount || 0
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to generate amortization schedule'
    });
  }
});

/**
 * POST /api/loans/apply
 * Create new loan application
 */
loanMgmtRouter.post('/apply', (req: Request, res: Response) => {
  try {
    const validatedData = ApplyLoanSchema.parse(req.body);

    const application = LoanService.createApplication(
      validatedData.userId,
      validatedData.productId,
      validatedData.amount,
      validatedData.tenure,
      validatedData
    );

    res.status(201).json({
      success: true,
      data: {
        applicationId: application.id,
        status: application.status,
        approvalRating: application.approvalRating,
        riskScore: application.riskScore,
        message: 'Loan application submitted successfully'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create application'
    });
  }
});

/**
 * GET /api/loans/applications/:applicationId
 * Get loan application details
 */
loanMgmtRouter.get('/applications/:applicationId', (req: Request, res: Response) => {
  try {
    const mockApplication = {
      id: req.params.applicationId,
      userId: 'user123',
      productId: 'personal-basic',
      amount: 300000,
      tenure: 24,
      purpose: 'Home renovation',
      employmentType: 'EMPLOYED',
      annualIncome: 1200000,
      existingLoans: 0,
      requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: LoanStatus.APPLICATION,
      riskScore: 78,
      approvalRating: 78,
      documents: []
    };

    res.json({
      success: true,
      data: mockApplication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
});

/**
 * POST /api/loans/approve/:applicationId
 * Approve a loan application
 */
loanMgmtRouter.post('/approve/:applicationId', (req: Request, res: Response) => {
  try {
    const mockLoanAccount = {
      id: `LOAN-${Date.now()}`,
      applicationId: req.params.applicationId,
      status: LoanStatus.APPROVED,
      approvedAt: new Date(),
      disbursalDetails: {
        method: 'BANK_TRANSFER',
        accountNumber: '****1234',
        ifscCode: 'SBIN0001234'
      },
      message: 'Loan approved successfully'
    };

    res.json({
      success: true,
      data: mockLoanAccount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to approve loan'
    });
  }
});

/**
 * POST /api/loans/reject/:applicationId
 * Reject a loan application
 */
loanMgmtRouter.post('/reject/:applicationId', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    res.json({
      success: true,
      data: {
        applicationId: req.params.applicationId,
        status: LoanStatus.CANCELLED,
        rejectionReason: reason || 'Application does not meet eligibility criteria',
        message: 'Loan application rejected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reject loan'
    });
  }
});

/**
 * GET /api/loans/accounts/:userId
 * Get all loan accounts for user
 */
loanMgmtRouter.get('/accounts/:userId', (req: Request, res: Response) => {
  try {
    const mockAccounts = [
      {
        id: 'LOAN-001',
        productName: 'Personal Loan',
        amount: 300000,
        emi: 14500,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 540 * 24 * 60 * 60 * 1000),
        progress: 10
      }
    ];

    res.json({
      success: true,
      data: {
        userId: req.params.userId,
        accounts: mockAccounts,
        total: mockAccounts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loan accounts'
    });
  }
});

/**
 * GET /api/loans/accounts/:loanAccountId/schedule
 * Get EMI schedule for a loan account
 */
loanMgmtRouter.get('/accounts/:loanAccountId/schedule', (req: Request, res: Response) => {
  try {
    const schedule = LoanService.generateAmortizationSchedule(300000, 10.5, 24, new Date());

    res.json({
      success: true,
      data: {
        loanAccountId: req.params.loanAccountId,
        schedule,
        totalEmis: schedule.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EMI schedule'
    });
  }
});

/**
 * GET /api/loans/accounts/:loanAccountId/history
 * Get repayment history for a loan
 */
loanMgmtRouter.get('/accounts/:loanAccountId/history', (req: Request, res: Response) => {
  try {
    const mockHistory = [
      {
        id: 'REP-001',
        emiNumber: 1,
        amount: 14500,
        dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        paidDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        status: 'PAID',
        paymentMethod: 'BANK_TRANSFER'
      }
    ];

    res.json({
      success: true,
      data: {
        loanAccountId: req.params.loanAccountId,
        history: mockHistory,
        total: mockHistory.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repayment history'
    });
  }
});

/**
 * POST /api/loans/accounts/:loanAccountId/repay
 * Record a repayment
 */
loanMgmtRouter.post('/accounts/:loanAccountId/repay', (req: Request, res: Response) => {
  try {
    const validatedData = RepaymentSchema.parse(req.body);

    const repayment = LoanService.processRepayment(
      req.params.loanAccountId,
      validatedData.amount,
      validatedData.paymentMethod,
      validatedData.referenceId
    );

    res.json({
      success: true,
      data: {
        repaymentId: repayment.id,
        transactionId: repayment.transactionId,
        amount: repayment.amount,
        status: repayment.status,
        message: 'Repayment processed successfully'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to process repayment'
    });
  }
});

/**
 * GET /api/loans/users/:userId/history
 * Get loan history for user
 */
loanMgmtRouter.get('/users/:userId/history', (req: Request, res: Response) => {
  try {
    const history = LoanService.generateLoanHistory(req.params.userId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loan history'
    });
  }
});

/**
 * GET /api/loans/accounts/:loanAccountId/health
 * Get loan health status
 */
loanMgmtRouter.get('/accounts/:loanAccountId/health', (req: Request, res: Response) => {
  try {
    const health = LoanService.calculateLoanHealth(10, 24, 0);

    res.json({
      success: true,
      data: {
        loanAccountId: req.params.loanAccountId,
        healthScore: health,
        status: health > 70 ? 'GOOD' : health > 40 ? 'FAIR' : 'POOR',
        details: {
          emisPaid: 10,
          totalEmis: 24,
          overdueEmis: 0,
          lastPaymentDate: new Date()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loan health'
    });
  }
});

/**
 * POST /api/loans/accounts/:loanAccountId/prepay
 * Calculate and process prepayment
 */
loanMgmtRouter.post('/accounts/:loanAccountId/prepay', (req: Request, res: Response) => {
  try {
    const prepaymentAmount = LoanService.calculatePrepaymentAmount(24, 10, 14500, 10.5);

    res.json({
      success: true,
      data: {
        loanAccountId: req.params.loanAccountId,
        prepaymentAmount: Math.round(prepaymentAmount * 100) / 100,
        interestSaved: Math.round((14500 * 14 - prepaymentAmount) * 100) / 100,
        message: 'Prepayment option available'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate prepayment'
    });
  }
});

export default loanMgmtRouter;
