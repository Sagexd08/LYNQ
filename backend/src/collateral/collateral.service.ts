import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LockCollateralDto, UnlockCollateralDto } from './dto';

export interface CollateralInfo {
  id: string;
  userId: string;
  tokenAddress: string;
  amount: number;
  chain: string | null;
  status: string;
  createdAt: Date;
}

const TOKEN_PRICES: Record<string, number> = {
  ETH: 2500,
  WETH: 2500,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  WBTC: 45000,
  LINK: 15,
  MATIC: 0.5,
};

@Injectable()
export class CollateralService {
  private readonly logger = new Logger(CollateralService.name);

  constructor(private readonly prisma: PrismaService) {}

  async lockCollateral(
    dto: LockCollateralDto,
    userId: string,
  ): Promise<CollateralInfo> {
    const loan = await this.prisma.loan.findUnique({
      where: { id: dto.loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== 'PENDING') {
      throw new BadRequestException(
        'Collateral can only be locked for pending loans',
      );
    }

    if (loan.userId !== userId) {
      throw new BadRequestException(
        'You can only lock collateral for your own loans',
      );
    }

    const collateral = await this.prisma.collateral.create({
      data: {
        userId: userId,
        tokenAddress: dto.tokenAddress.toLowerCase(),
        amount: dto.amount,
        chain: dto.chainId?.toString() || 'ethereum',
        status: 'LOCKED',
      },
    });

    this.logger.log(
      `Collateral locked: ${collateral.id} for loan ${dto.loanId}`,
    );

    return this.toCollateralInfo(collateral);
  }

  async unlockCollateral(
    dto: UnlockCollateralDto,
    userId: string,
  ): Promise<CollateralInfo> {
    // Find collateral by user and status
    const collateral = await this.prisma.collateral.findFirst({
      where: {
        userId: userId,
        status: 'LOCKED',
        tokenAddress: dto.tokenAddress?.toLowerCase(),
      },
    });

    if (!collateral) {
      throw new NotFoundException('Locked collateral not found');
    }

    // Check if loan is repaid
    const loan = await this.prisma.loan.findFirst({
      where: {
        id: dto.loanId,
        userId: userId,
        status: 'REPAID',
      },
    });

    if (!loan) {
      throw new BadRequestException(
        'Collateral can only be unlocked for repaid loans',
      );
    }

    const updated = await this.prisma.collateral.update({
      where: { id: collateral.id },
      data: {
        status: 'UNLOCKED',
      },
    });

    this.logger.log(
      `Collateral unlocked: ${updated.id} for loan ${dto.loanId}`,
    );

    return this.toCollateralInfo(updated);
  }

  async seizeCollateral(loanId: string): Promise<CollateralInfo[]> {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== 'DEFAULTED' && loan.status !== 'LIQUIDATED') {
      throw new BadRequestException(
        'Collateral can only be seized for defaulted or liquidated loans',
      );
    }

    const collaterals = await this.prisma.collateral.findMany({
      where: {
        userId: loan.userId,
        status: 'LOCKED',
      },
    });

    if (collaterals.length === 0) {
      throw new NotFoundException('No locked collateral found for this loan');
    }

    const seizedCollaterals: CollateralInfo[] = [];

    for (const collateral of collaterals) {
      const seized = await this.prisma.collateral.update({
        where: { id: collateral.id },
        data: {
          status: 'LIQUIDATED',
        },
      });
      seizedCollaterals.push(this.toCollateralInfo(seized));
    }

    this.logger.log(
      `Collateral seized for loan ${loanId}: ${seizedCollaterals.length} items`,
    );

    return seizedCollaterals;
  }

  async getCollateralByUser(userId: string): Promise<CollateralInfo[]> {
    const collaterals = await this.prisma.collateral.findMany({
      where: { userId },
    });

    return collaterals.map((c) => this.toCollateralInfo(c));
  }

  async getCollateralById(id: string): Promise<CollateralInfo> {
    const collateral = await this.prisma.collateral.findUnique({
      where: { id },
    });

    if (!collateral) {
      throw new NotFoundException('Collateral not found');
    }

    return this.toCollateralInfo(collateral);
  }

  async getTotalCollateralValue(userId: string): Promise<number> {
    const collaterals = await this.prisma.collateral.findMany({
      where: { userId, status: 'LOCKED' },
    });

    return collaterals.reduce((sum, c) => {
      const price = TOKEN_PRICES[c.tokenAddress.toUpperCase()] || 1;
      return sum + Number(c.amount) * price;
    }, 0);
  }

  async updateCollateralValue(id: string): Promise<CollateralInfo> {
    const collateral = await this.prisma.collateral.findUnique({
      where: { id },
    });

    if (!collateral) {
      throw new NotFoundException('Collateral not found');
    }

    // Update last valuation
    const price = TOKEN_PRICES[collateral.tokenAddress.toUpperCase()] || 1;
    const newValue = Number(collateral.amount) * price;

    const updated = await this.prisma.collateral.update({
      where: { id },
      data: {
        lastValuation: newValue,
        lastValuationAt: new Date(),
      },
    });

    return this.toCollateralInfo(updated);
  }

  private toCollateralInfo(collateral: any): CollateralInfo {
    return {
      id: collateral.id,
      userId: collateral.userId,
      tokenAddress: collateral.tokenAddress,
      amount: Number(collateral.amount),
      chain: collateral.chain,
      status: collateral.status,
      createdAt: collateral.createdAt,
    };
  }
}
