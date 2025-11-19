import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { User } from '../../user/entities/user.entity';

export interface RiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultProbability: number;
  liquidationRisk: number;
  collateralHealth: number;
  factors: {
    creditScore: number;
    collateralRatio: number;
    marketVolatility: number;
    historicalPerformance: number;
  };
  recommendations: string[];
}

@Injectable()
export class RiskAssessmentService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async assessLoan(loanId: string): Promise<RiskAssessment> {
    const loan = await this.loanRepository.findOne({ 
      where: { id: loanId },
      relations: ['user'],
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    const creditScore = await this.estimateCreditScore(loan.userId);
    const collateralRatio = this.calculateCollateralRatio(loan);
    const marketVolatility = await this.getMarketVolatility(loan.chain);
    const historicalPerformance = await this.getUserPerformance(loan.userId);

    const defaultProbability = this.calculateDefaultProbability({
      creditScore,
      collateralRatio,
      marketVolatility,
      historicalPerformance,
    });

    const liquidationRisk = this.calculateLiquidationRisk(collateralRatio, marketVolatility);
    const collateralHealth = this.calculateCollateralHealth(collateralRatio, liquidationRisk);
    const riskLevel = this.determineRiskLevel(defaultProbability, liquidationRisk);

    return {
      riskLevel,
      defaultProbability,
      liquidationRisk,
      collateralHealth,
      factors: {
        creditScore,
        collateralRatio,
        marketVolatility,
        historicalPerformance,
      },
      recommendations: this.generateRiskRecommendations(riskLevel, defaultProbability),
    };
  }

  async predictDefault(data: any): Promise<{ probability: number; confidence: number }> {
    const features = this.extractFeatures(data);
    const probability = this.runPredictionModel(features);
    const confidence = 0.85;

    return { probability, confidence };
  }

  private async estimateCreditScore(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user ? user.reputationPoints * 0.5 : 300;
  }

  private calculateCollateralRatio(loan: Loan): number {
    const collateralValue = parseFloat(loan.collateralAmount);
    const loanValue = parseFloat(loan.amount);
    return (collateralValue / loanValue) * 100;
  }

  private async getMarketVolatility(chain: string): Promise<number> {
    const volatilityMap: Record<string, number> = {
      'ethereum': 0.25,
      'polygon': 0.30,
      'bsc': 0.28,
      'aptos': 0.35,
      'flow': 0.32,
    };
    return volatilityMap[chain] || 0.30;
  }

  private async getUserPerformance(userId: string): Promise<number> {
    const loans = await this.loanRepository.find({ where: { userId } });
    
    if (loans.length === 0) return 50;

    const repaidOnTime = loans.filter(l => 
      l.status === 'REPAID' && 
      l.repaidDate && 
      l.dueDate && 
      l.repaidDate <= l.dueDate
    ).length;

    return (repaidOnTime / loans.length) * 100;
  }

  private calculateDefaultProbability(factors: any): number {
    const creditScoreWeight = 0.40;
    const collateralRatioWeight = 0.30;
    const marketVolatilityWeight = 0.15;
    const performanceWeight = 0.15;

    const creditScoreRisk = Math.max(0, 100 - (factors.creditScore / 10));
    const collateralRisk = Math.max(0, 100 - factors.collateralRatio);
    const volatilityRisk = factors.marketVolatility * 100;
    const performanceRisk = 100 - factors.historicalPerformance;

    const weightedRisk = 
      creditScoreRisk * creditScoreWeight +
      collateralRisk * collateralRatioWeight +
      volatilityRisk * marketVolatilityWeight +
      performanceRisk * performanceWeight;

    return Math.min(100, Math.max(0, weightedRisk));
  }

  private calculateLiquidationRisk(collateralRatio: number, volatility: number): number {
    const liquidationThreshold = 120;
    const buffer = collateralRatio - liquidationThreshold;
    const volatilityAdjusted = buffer / (volatility * 100);

    if (volatilityAdjusted < 1) return 80;
    if (volatilityAdjusted < 2) return 50;
    if (volatilityAdjusted < 3) return 25;
    return 10;
  }

  private calculateCollateralHealth(collateralRatio: number, liquidationRisk: number): number {
    return Math.min(100, (collateralRatio / 2) - liquidationRisk);
  }

  private determineRiskLevel(defaultProb: number, liquidationRisk: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const avgRisk = (defaultProb + liquidationRisk) / 2;

    if (avgRisk >= 70) return 'CRITICAL';
    if (avgRisk >= 50) return 'HIGH';
    if (avgRisk >= 30) return 'MEDIUM';
    return 'LOW';
  }

  private generateRiskRecommendations(riskLevel: string, defaultProb: number): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      recommendations.push('Consider adding more collateral to reduce risk');
      recommendations.push('Monitor market conditions closely');
    }

    if (defaultProb > 50) {
      recommendations.push('Review repayment schedule and consider early repayment');
    }

    if (riskLevel === 'MEDIUM') {
      recommendations.push('Maintain healthy collateral ratio above 150%');
    }

    return recommendations;
  }

  private extractFeatures(data: any): number[] {
    return [
      data.creditScore || 600,
      data.loanAmount || 1000,
      data.collateralRatio || 150,
      data.accountAge || 30,
      data.previousLoans || 0,
    ];
  }

  private runPredictionModel(features: number[]): number {
    const weights = [0.3, 0.2, 0.25, 0.15, 0.1];
    const normalized = features.map((f, i) => (f / 1000) * weights[i]);
    const prediction = normalized.reduce((sum, val) => sum + val, 0);
    
    return Math.min(100, Math.max(0, prediction * 100));
  }
}
