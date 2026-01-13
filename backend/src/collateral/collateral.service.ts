import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LockCollateralDto, UnlockCollateralDto } from './dto';

export interface CollateralInfo {
    id: string;
    loanId: string;
    tokenAddress: string;
    tokenSymbol: string;
    amount: number;
    valueUsd: number;
    chainId: number;
    status: string;
    lockedAt: Date;
    releasedAt?: Date;
    seizedAt?: Date;
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

    constructor(private readonly prisma: PrismaService) { }

    async lockCollateral(dto: LockCollateralDto): Promise<CollateralInfo> {
        const loan = await this.prisma.loan.findUnique({
            where: { id: dto.loanId },
        });

        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        if (loan.status !== 'PENDING') {
            throw new BadRequestException('Collateral can only be locked for pending loans');
        }

        const valueUsd = this.calculateValueUsd(dto.tokenSymbol, dto.amount);

        const collateral = await this.prisma.collateral.create({
            data: {
                loanId: dto.loanId,
                tokenAddress: dto.tokenAddress.toLowerCase(),
                tokenSymbol: dto.tokenSymbol.toUpperCase(),
                amount: dto.amount,
                valueUsd,
                chainId: dto.chainId,
                status: 'LOCKED',
                onChainTxHash: dto.txHash,
            },
        });

        this.logger.log(`Collateral locked: ${collateral.id} for loan ${dto.loanId}`);

        return this.toCollateralInfo(collateral);
    }

    async unlockCollateral(dto: UnlockCollateralDto): Promise<CollateralInfo> {
        const collateral = await this.prisma.collateral.findFirst({
            where: { loanId: dto.loanId, status: 'LOCKED' },
            include: { loan: true },
        });

        if (!collateral) {
            throw new NotFoundException('Locked collateral not found for this loan');
        }

        if (collateral.loan.status !== 'REPAID') {
            throw new BadRequestException('Collateral can only be unlocked for repaid loans');
        }

        const updated = await this.prisma.collateral.update({
            where: { id: collateral.id },
            data: {
                status: 'RELEASED',
                releasedAt: new Date(),
                onChainTxHash: dto.txHash || collateral.onChainTxHash,
            },
        });

        this.logger.log(`Collateral unlocked: ${updated.id} for loan ${dto.loanId}`);

        return this.toCollateralInfo(updated);
    }

    async seizeCollateral(loanId: string): Promise<CollateralInfo[]> {
        const collaterals = await this.prisma.collateral.findMany({
            where: { loanId, status: 'LOCKED' },
            include: { loan: true },
        });

        if (collaterals.length === 0) {
            throw new NotFoundException('No locked collateral found for this loan');
        }

        const loan = collaterals[0].loan;
        if (loan.status !== 'DEFAULTED' && loan.status !== 'LIQUIDATED') {
            throw new BadRequestException('Collateral can only be seized for defaulted or liquidated loans');
        }

        const seizedCollaterals: CollateralInfo[] = [];

        for (const collateral of collaterals) {
            const seized = await this.prisma.collateral.update({
                where: { id: collateral.id },
                data: {
                    status: 'SEIZED',
                    seizedAt: new Date(),
                },
            });
            seizedCollaterals.push(this.toCollateralInfo(seized));
        }

        this.logger.log(`Collateral seized for loan ${loanId}: ${seizedCollaterals.length} items`);

        return seizedCollaterals;
    }

    async getCollateralByLoan(loanId: string): Promise<CollateralInfo[]> {
        const collaterals = await this.prisma.collateral.findMany({
            where: { loanId },
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

    async getTotalCollateralValue(loanId: string): Promise<number> {
        const collaterals = await this.prisma.collateral.findMany({
            where: { loanId, status: 'LOCKED' },
        });

        return collaterals.reduce((sum, c) => sum + c.valueUsd, 0);
    }

    async updateCollateralValue(id: string): Promise<CollateralInfo> {
        const collateral = await this.prisma.collateral.findUnique({
            where: { id },
        });

        if (!collateral) {
            throw new NotFoundException('Collateral not found');
        }

        const newValueUsd = this.calculateValueUsd(collateral.tokenSymbol, collateral.amount);

        const updated = await this.prisma.collateral.update({
            where: { id },
            data: { valueUsd: newValueUsd },
        });

        return this.toCollateralInfo(updated);
    }

    private calculateValueUsd(tokenSymbol: string, amount: number): number {
        const price = TOKEN_PRICES[tokenSymbol.toUpperCase()] || 1;
        return amount * price;
    }

    private toCollateralInfo(collateral: any): CollateralInfo {
        return {
            id: collateral.id,
            loanId: collateral.loanId,
            tokenAddress: collateral.tokenAddress,
            tokenSymbol: collateral.tokenSymbol,
            amount: collateral.amount,
            valueUsd: collateral.valueUsd,
            chainId: collateral.chainId,
            status: collateral.status,
            lockedAt: collateral.lockedAt,
            releasedAt: collateral.releasedAt,
            seizedAt: collateral.seizedAt,
        };
    }
}
