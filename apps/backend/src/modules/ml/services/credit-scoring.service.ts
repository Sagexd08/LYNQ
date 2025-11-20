import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { RiskModel } from '../../../services/advancedAIEngine';

export interface CreditScoreResult {
  score: number;
  grade: string;
  factors: {
    paymentHistory: number;
    loanUtilization: number;
    accountAge: number;
    reputationPoints: number;
    diversification: number;
    aiAdjustment: number;
  };
  recommendations: string[];
}

@Injectable()
export class CreditScoringService implements OnModuleInit {
  private riskModel: RiskModel;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {
    this.riskModel = new RiskModel();
  }

  async onModuleInit() {
    await this.riskModel.initialize();
  }

  async calculateScore(userId: string): Promise<CreditScoreResult> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['loans'] });
    if (!user) {
      throw new Error('User not found');
    }

    const loans = await this.loanRepository.find({ where: { userId } });

    const paymentHistoryScore = this.calculatePaymentHistory(loans);
    const utilizationScore = this.calculateLoanUtilization(loans);
    const accountAgeScore = this.calculateAccountAge(user);
    const reputationScore = this.normalizeReputationPoints(user.reputationPoints);
    const diversificationScore = this.calculateDiversification(loans);

    // AI Adjustment using embedded Risk Model
    const aiInput = [
      paymentHistoryScore / 100,
      utilizationScore / 100,
      accountAgeScore / 100,
      reputationScore / 100,
      diversificationScore / 100
    ];
    
    const aiPrediction = this.riskModel.predict(aiInput);
    // Map 0-100 prediction to -25 to +25 adjustment
    const aiAdjustment = Math.round((aiPrediction - 50) / 2); 

    let totalScore = Math.round(
      paymentHistoryScore * 0.35 +
      utilizationScore * 0.25 +
      accountAgeScore * 0.15 +
      reputationScore * 0.15 +
      diversificationScore * 0.10 +
      aiAdjustment
    );

    // Clamp score between 300 and 850
    totalScore = Math.max(300, Math.min(850, totalScore));

    return {
      score: totalScore,
      grade: this.getGrade(totalScore),
      factors: {
        paymentHistory: paymentHistoryScore,
        loanUtilization: utilizationScore,
        accountAge: accountAgeScore,
        reputationPoints: reputationScore,
        diversification: diversificationScore,
        aiAdjustment: aiAdjustment
      },
      recommendations: this.generateRecommendations(totalScore, {
        paymentHistory: paymentHistoryScore,
        loanUtilization: utilizationScore,
        accountAge: accountAgeScore,
        reputationPoints: reputationScore,
        diversification: diversificationScore
      }),
    };
  }

  private calculatePaymentHistory(loans: Loan[]): number {
    if (loans.length === 0) return 50;

    const repaidLoans = loans.filter(l => l.status === 'REPAID');
    const defaultedLoans = loans.filter(l => l.status === 'DEFAULTED');
    
    const repaymentRate = repaidLoans.length / loans.length;
    const penaltyForDefaults = defaultedLoans.length * 15;

    return Math.max(0, Math.min(100, (repaymentRate * 100) - penaltyForDefaults));
  }

  private calculateLoanUtilization(loans: Loan[]): number {
    const activeLoans = loans.filter(l => l.status === 'ACTIVE');
    if (activeLoans.length === 0) return 100;

    const totalBorrowed = activeLoans.reduce((sum, l) => sum + parseFloat(l.amount), 0);
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + parseFloat(l.outstandingAmount), 0);

    const utilization = (totalOutstanding / (totalBorrowed || 1)) * 100;
    
    if (utilization < 30) return 100;
    if (utilization < 50) return 80;
    if (utilization < 70) return 60;
    return 40;
  }

  private calculateAccountAge(user: User): number {
    const accountAgeMonths = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (accountAgeMonths < 1) return 20;
    if (accountAgeMonths < 3) return 40;
    if (accountAgeMonths < 6) return 60;
    if (accountAgeMonths < 12) return 80;
    return 100;
  }

  private normalizeReputationPoints(points: number): number {
    return Math.min(100, (points / 150) * 100);
  }

  private calculateDiversification(loans: Loan[]): number {
    if (loans.length === 0) return 50;

    const uniqueChains = new Set(loans.map(l => l.chain));
    const chainDiversity = (uniqueChains.size / 3) * 100;

    return Math.min(100, chainDiversity);
  }

  private getGrade(score: number): string {
    if (score >= 800) return 'A+';
    if (score >= 750) return 'A';
    if (score >= 700) return 'B+';
    if (score >= 650) return 'B';
    if (score >= 600) return 'C+';
    if (score >= 550) return 'C';
    if (score >= 500) return 'D';
    return 'F';
  }

  private generateRecommendations(score: number, factors: any): string[] {
    const recommendations: string[] = [];

    if (factors.paymentHistory < 70) {
      recommendations.push('Make on-time payments to improve your payment history');
    }

    if (factors.loanUtilization < 60) {
      recommendations.push('Reduce your active loan balance to improve utilization ratio');
    }

    if (factors.reputationPoints < 60) {
      recommendations.push('Complete learning quests to earn reputation points');
    }

    if (factors.diversification < 50) {
      recommendations.push('Diversify across multiple chains to improve your profile');
    }

    if (score < 650) {
      recommendations.push('Consider starting with smaller loans to build credit history');
    }

    return recommendations;
  }
}
