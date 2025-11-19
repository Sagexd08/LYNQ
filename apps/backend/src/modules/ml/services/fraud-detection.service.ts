import { Injectable } from '@nestjs/common';

export interface FraudAnalysis {
  isSuspicious: boolean;
  riskScore: number;
  flags: string[];
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
}

@Injectable()
export class FraudDetectionService {
  async analyzeTransaction(data: any): Promise<FraudAnalysis> {
    const flags: string[] = [];
    let riskScore = 0;

    if (this.isUnusualAmount(data.amount)) {
      flags.push('Unusual transaction amount');
      riskScore += 25;
    }

    if (this.isVelocityAnomaly(data.userId, data.timestamp)) {
      flags.push('High transaction velocity detected');
      riskScore += 30;
    }

    if (this.isNewAccount(data.accountAge)) {
      flags.push('New account with high-value transaction');
      riskScore += 20;
    }

    if (this.isSuspiciousPattern(data)) {
      flags.push('Suspicious transaction pattern detected');
      riskScore += 35;
    }

    if (this.isBlacklistedAddress(data.walletAddress)) {
      flags.push('Wallet address flagged in security database');
      riskScore += 50;
    }

    const isSuspicious = riskScore >= 50;
    const recommendation = this.getRecommendation(riskScore);

    return {
      isSuspicious,
      riskScore,
      flags,
      recommendation,
    };
  }

  private isUnusualAmount(amount: number): boolean {
    return amount > 100000 || amount < 10;
  }

  private isVelocityAnomaly(userId: string, timestamp: Date): boolean {
    return false;
  }

  private isNewAccount(accountAgeDays: number): boolean {
    return accountAgeDays < 7;
  }

  private isSuspiciousPattern(data: any): boolean {
    const hasSameWallet = data.fromWallet === data.toWallet;
    const rapidRepetition = data.transactionCount > 10;
    
    return hasSameWallet || rapidRepetition;
  }

  private isBlacklistedAddress(address: string): boolean {
    const blacklist = [];
    return blacklist.includes(address.toLowerCase());
  }

  private getRecommendation(riskScore: number): 'APPROVE' | 'REVIEW' | 'REJECT' {
    if (riskScore >= 70) return 'REJECT';
    if (riskScore >= 40) return 'REVIEW';
    return 'APPROVE';
  }

  async trainModel(trainingData: any[]): Promise<void> {
    console.log('Training fraud detection model with', trainingData.length, 'samples');
  }

  async getBehaviorProfile(userId: string): Promise<any> {
    return {
      averageTransactionAmount: 1000,
      transactionFrequency: 5,
      preferredChains: ['ethereum', 'polygon'],
      typicalHours: [9, 10, 11, 14, 15, 16],
    };
  }
}
