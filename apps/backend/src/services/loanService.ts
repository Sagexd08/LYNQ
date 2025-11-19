
export enum LoanStatus {
  APPLICATION = 'APPLICATION',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULT = 'DEFAULT',
  CANCELLED = 'CANCELLED'
}

export enum LoanProduct {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  EDUCATION = 'EDUCATION',
  EMERGENCY = 'EMERGENCY'
}

// Core Data Models
export interface LoanProduct_Details {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTenure: number; // months
  maxTenure: number;
  baseRate: number; // percentage
  processingFee: number;
  elegibilityScore: number; // minimum credit/risk score
  documentation: string[];
}

export interface LoanApplication {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  tenure: number; // months
  purpose: string;
  employmentType: 'EMPLOYED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'OTHER';
  annualIncome: number;
  existingLoans: number;
  requestedAt: Date;
  status: LoanStatus;
  riskScore: number;
  approvalRating: number; // 0-100
  approvedAmount?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  documents: DocumentUpload[];
}

export interface DocumentUpload {
  id: string;
  type: string; // 'ID', 'INCOME', 'BANK_STATEMENT', 'EMPLOYMENT'
  url: string;
  uploadedAt: Date;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface LoanAccount {
  id: string;
  userId: string;
  applicationId: string;
  productId: string;
  loanAmount: number;
  approvedAmount: number;
  disbursedAmount: number;
  interestRate: number; // annual percentage
  tenure: number; // months
  processingFee: number;
  otherCharges: number;
  totalAmount: number; // principal + interest + fees
  startDate: Date;
  endDate: Date;
  status: LoanStatus;
  createdAt: Date;
}

export interface EMI {
  id: string;
  loanAccountId: string;
  emiNumber: number;
  dueDate: Date;
  amount: number; // Fixed EMI
  principal: number;
  interest: number;
  charges: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';
  paidDate?: Date;
  paidAmount?: number;
  penalty?: number;
  lateDays?: number;
}

export interface Repayment {
  id: string;
  loanAccountId: string;
  emiId?: string;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'WALLET' | 'CARD' | 'CRYPTO';
  referenceId: string;
  transactionId: string;
  paidAt: Date;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  notes?: string;
}

export interface LoanHistory {
  id: string;
  userId: string;
  totalLoansApplied: number;
  totalLoansApproved: number;
  totalLoansRejected: number;
  totalBorrowed: number;
  totalRepaid: number;
  currentActiveLoans: number;
  defaultCount: number;
  averageEMI: number;
  lastLoanDate?: Date;
  cibilScore?: number;
}

/**
 * Loan Management Service Class
 */
export class LoanService {
  /**
   * Get available loan products
   */
  static getAvailableProducts(): LoanProduct_Details[] {
    return [
      {
        id: 'personal-basic',
        name: 'Personal Loan - Basic',
        description: 'Quick personal loans up to 500,000',
        minAmount: 50000,
        maxAmount: 500000,
        minTenure: 12,
        maxTenure: 60,
        baseRate: 10.5,
        processingFee: 1500,
        elegibilityScore: 600,
        documentation: ['AADHAR', 'INCOME_PROOF', 'BANK_STATEMENT']
      },
      {
        id: 'personal-premium',
        name: 'Personal Loan - Premium',
        description: 'Premium loans for higher amounts',
        minAmount: 500000,
        maxAmount: 2500000,
        minTenure: 12,
        maxTenure: 84,
        baseRate: 9.5,
        processingFee: 5000,
        elegibilityScore: 700,
        documentation: ['AADHAR', 'INCOME_PROOF', 'BANK_STATEMENT', 'EMPLOYMENT_LETTER']
      },
      {
        id: 'business-startup',
        name: 'Business Loan - Startup',
        description: 'Business loans for startups',
        minAmount: 100000,
        maxAmount: 1000000,
        minTenure: 24,
        maxTenure: 60,
        baseRate: 12.5,
        processingFee: 3000,
        elegibilityScore: 650,
        documentation: ['BUSINESS_REG', 'GST_CERT', 'BANK_STATEMENT', 'CA_AUDIT']
      },
      {
        id: 'education-loan',
        name: 'Education Loan',
        description: 'Loans for educational pursuits',
        minAmount: 50000,
        maxAmount: 1000000,
        minTenure: 60,
        maxTenure: 240,
        baseRate: 8.5,
        processingFee: 2000,
        elegibilityScore: 550,
        documentation: ['ADMISSION_LETTER', 'INCOME_PROOF', 'PARENT_GUARANTOR']
      }
    ];
  }

  /**
   * Get product by ID
   */
  static getProductById(productId: string): LoanProduct_Details | null {
    return this.getAvailableProducts().find(p => p.id === productId) || null;
  }

  /**
   * Create loan application
   */
  static createApplication(
    userId: string,
    productId: string,
    amount: number,
    tenure: number,
    applicantData: any
  ): LoanApplication {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error('Invalid product ID');
    }

    // Validate amount and tenure
    if (amount < product.minAmount || amount > product.maxAmount) {
      throw new Error(`Amount must be between ${product.minAmount} and ${product.maxAmount}`);
    }
    if (tenure < product.minTenure || tenure > product.maxTenure) {
      throw new Error(`Tenure must be between ${product.minTenure} and ${product.maxTenure} months`);
    }

    // Calculate risk score (mock implementation)
    const riskScore = this.calculateRiskScore(applicantData, product);
    const approvalRating = Math.max(0, Math.min(100, riskScore));

    return {
      id: `APP-${Date.now()}`,
      userId,
      productId,
      amount,
      tenure,
      purpose: applicantData.purpose || '',
      employmentType: applicantData.employmentType,
      annualIncome: applicantData.annualIncome,
      existingLoans: applicantData.existingLoans || 0,
      requestedAt: new Date(),
      status: LoanStatus.APPLICATION,
      riskScore,
      approvalRating,
      documents: []
    };
  }

  /**
   * Calculate risk score for application
   */
  static calculateRiskScore(applicantData: any, product: LoanProduct_Details): number {
    let score = 100; // Start with perfect score

    // Income to loan ratio (ideal: 5-10x monthly income)
    const monthlyIncome = applicantData.annualIncome / 12;
    const monthlyEMI = this.calculateEMI(
      applicantData.loanAmount || product.minAmount,
      product.baseRate,
      applicantData.tenure || product.minTenure
    );

    if (monthlyEMI > monthlyIncome * 0.5) {
      score -= 30; // High EMI burden
    } else if (monthlyEMI > monthlyIncome * 0.3) {
      score -= 15;
    }

    // Existing loan obligations
    if (applicantData.existingLoans > 0) {
      score -= Math.min(20, applicantData.existingLoans * 5);
    }

    // Employment type (risk)
    switch (applicantData.employmentType) {
      case 'BUSINESS':
        score -= 10;
        break;
      case 'SELF_EMPLOYED':
        score -= 5;
        break;
      case 'OTHER':
        score -= 15;
        break;
    }

    // Credit score/risk profile
    if (applicantData.riskScore) {
      const riskDelta = product.elegibilityScore - applicantData.riskScore;
      if (riskDelta > 0) {
        score -= Math.min(30, riskDelta * 0.5);
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate EMI (Equated Monthly Installment)
   * Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
   */
  static calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    
    if (monthlyRate === 0) {
      return principal / tenureMonths;
    }

    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    
    return numerator / denominator;
  }

  /**
   * Generate amortization schedule
   */
  static generateAmortizationSchedule(
    loanAmount: number,
    annualRate: number,
    tenureMonths: number,
    startDate: Date
  ): EMI[] {
    const emiAmount = this.calculateEMI(loanAmount, annualRate, tenureMonths);
    const monthlyRate = annualRate / 12 / 100;
    let balance = loanAmount;
    const schedule: EMI[] = [];

    for (let i = 1; i <= tenureMonths; i++) {
      const interest = balance * monthlyRate;
      const principal = emiAmount - interest;
      balance -= principal;

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        id: `EMI-${i}`,
        loanAccountId: '', // Will be set when loan is created
        emiNumber: i,
        dueDate,
        amount: emiAmount,
        principal: Math.max(0, principal),
        interest: Math.max(0, interest),
        charges: 0,
        status: 'PENDING'
      });
    }

    return schedule;
  }

  /**
   * Calculate loan summary
   */
  static calculateLoanSummary(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    processingFee: number
  ): {
    emi: number;
    totalInterest: number;
    totalAmount: number;
    totalWithFees: number;
  } {
    const emi = this.calculateEMI(principal, annualRate, tenureMonths);
    const totalAmount = emi * tenureMonths;
    const totalInterest = totalAmount - principal;
    const totalWithFees = totalAmount + processingFee;

    return {
      emi: Math.round(emi * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalWithFees: Math.round(totalWithFees * 100) / 100
    };
  }

  /**
   * Approve loan application
   */
  static approveLoan(application: LoanApplication, approvalNotes?: string): LoanAccount {
    const product = this.getProductById(application.productId)!;
    const summary = this.calculateLoanSummary(
      application.amount,
      product.baseRate,
      application.tenure,
      product.processingFee
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + application.tenure);

    return {
      id: `LOAN-${Date.now()}`,
      userId: application.userId,
      applicationId: application.id,
      productId: application.productId,
      loanAmount: application.amount,
      approvedAmount: application.amount,
      disbursedAmount: 0,
      interestRate: product.baseRate,
      tenure: application.tenure,
      processingFee: product.processingFee,
      otherCharges: 0,
      totalAmount: summary.totalWithFees,
      startDate,
      endDate,
      status: LoanStatus.APPROVED,
      createdAt: new Date()
    };
  }

  /**
   * Calculate loan health score
   */
  static calculateLoanHealth(emisPaid: number, totalEmis: number, overdueCount: number): number {
    const paymentHealth = (emisPaid / totalEmis) * 70; // 70% weight
    const overdueHealth = Math.max(0, 30 - overdueCount * 5); // 30% weight
    
    return Math.round(paymentHealth + overdueHealth);
  }

  /**
   * Process repayment
   */
  static processRepayment(
    loanAccountId: string,
    amount: number,
    paymentMethod: string,
    referenceId: string
  ): Repayment {
    return {
      id: `REP-${Date.now()}`,
      loanAccountId,
      amount,
      paymentMethod: paymentMethod as any,
      referenceId,
      transactionId: `TXN-${Date.now()}`,
      paidAt: new Date(),
      status: 'SUCCESS'
    };
  }

  /**
   * Get loan history for user
   */
  static generateLoanHistory(userId: string): LoanHistory {
    // Mock implementation - would fetch from database
    return {
      id: `HIST-${userId}`,
      userId,
      totalLoansApplied: 2,
      totalLoansApproved: 2,
      totalLoansRejected: 0,
      totalBorrowed: 1500000,
      totalRepaid: 1450000,
      currentActiveLoans: 1,
      defaultCount: 0,
      averageEMI: 15000,
      lastLoanDate: new Date(),
      cibilScore: 750
    };
  }

  /**
   * Calculate prepayment amount
   */
  static calculatePrepaymentAmount(
    totalEmis: number,
    paidEmis: number,
    monthlyEMI: number,
    interestRate: number
  ): number {
    const remainingEmis = totalEmis - paidEmis;
    const balance = remainingEmis * monthlyEMI;
    
    // Interest waiver on prepayment (simplified)
    const waiverPercentage = Math.min(10, remainingEmis * 0.5);
    const interestWaiver = (balance * waiverPercentage) / 100;
    
    return balance - interestWaiver;
  }
}

export default LoanService;
