import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { formatUnits } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService, OnChainLoanInfo } from './blockchain.service';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class ReconciliationService {
    private readonly logger = new Logger(ReconciliationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly blockchainService: BlockchainService,
    ) {}

    // Run reconciliation every 15 minutes
    @Cron('*/15 * * * *')
    async reconcileLoans() {
        if (!this.blockchainService.isBlockchainConnected()) {
            this.logger.warn('Blockchain not connected, skipping reconciliation');
            return;
        }

        this.logger.log('Starting loan reconciliation...');

        // Get all active loans with on-chain IDs
        const loans = await this.prisma.loan.findMany({
            where: {
                status: { in: ['ACTIVE', 'PENDING'] },
                onChainLoanId: { not: null },
            },
        });

        let reconciled = 0;
        let discrepancies = 0;

        for (const loan of loans) {
            try {
                const onChainLoan = await this.blockchainService.getLoanFromChain(loan.onChainLoanId!);
                const result = await this.reconcileLoan(loan, onChainLoan);
                
                if (result.updated) {
                    reconciled++;
                }
                if (result.discrepancy) {
                    discrepancies++;
                }
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : String(error);
                const errorStack = error instanceof Error ? error.stack : undefined;
                this.logger.error(
                    `Failed to reconcile loan ${loan.id}: ${errorMessage}`,
                    errorStack
                );
            }
        }

        this.logger.log(`Reconciliation complete: ${reconciled} updated, ${discrepancies} discrepancies`);
    }

    private async reconcileLoan(
        dbLoan: any,
        onChainLoan: OnChainLoanInfo,
    ): Promise<{ updated: boolean; discrepancy: boolean }> {
        const onChainStatus = this.mapOnChainStatus(onChainLoan.status);
        let updated = false;
        let discrepancy = false;

        // Check status mismatch
        if (dbLoan.status !== onChainStatus) {
            this.logger.warn(
                `Status mismatch for loan ${dbLoan.id}: DB=${dbLoan.status}, Chain=${onChainStatus}`
            );

            // On-chain is source of truth for status
            await this.prisma.loan.update({
                where: { id: dbLoan.id },
                data: { status: onChainStatus },
            });

            // Log discrepancy for audit
            await this.logDiscrepancy(dbLoan.id, 'status', dbLoan.status, onChainStatus);
            
            updated = true;
            discrepancy = true;
        }

        const onChainRepaidWei = BigInt(onChainLoan.amountRepaid.toString());
        const dbOutstandingWei = BigInt(Math.floor(Number(dbLoan.outstandingAmount) * 1e18));
        const dbAmountWei = BigInt(Math.floor(Number(dbLoan.amount) * 1e18));
        const expectedOutstandingWei = dbAmountWei - onChainRepaidWei;
        const onChainRepaid = parseFloat(formatUnits(onChainLoan.amountRepaid, 18));
        const dbOutstanding = Number(dbLoan.outstandingAmount);
        const expectedOutstanding = parseFloat(formatUnits(expectedOutstandingWei.toString(), 18));

        if (Math.abs(dbOutstanding - expectedOutstanding) > 0.01) {
            this.logger.warn(
                `Amount mismatch for loan ${dbLoan.id}: DB outstanding=${dbOutstanding}, expected=${expectedOutstanding}`
            );

            await this.prisma.loan.update({
                where: { id: dbLoan.id },
                data: { outstandingAmount: expectedOutstanding },
            });

            await this.logDiscrepancy(dbLoan.id, 'outstandingAmount', dbOutstanding, expectedOutstanding);
            
            updated = true;
            discrepancy = true;
        }

        return { updated, discrepancy };
    }

    private mapOnChainStatus(status: number): LoanStatus {
        const statusMap: Record<number, LoanStatus> = {
            0: 'PENDING',
            1: 'ACTIVE',
            2: 'REPAID',
            3: 'DEFAULTED',
            4: 'LIQUIDATED',
        };
        return statusMap[status] || 'PENDING';
    }

    private async logDiscrepancy(
        loanId: string,
        field: string,
        dbValue: any,
        chainValue: any,
    ) {
        // Log to a discrepancy table for audit trail
        this.logger.error(
            `DISCREPANCY: loan=${loanId}, field=${field}, db=${dbValue}, chain=${chainValue}`
        );
        
        // Optionally store in DB for review
        // await this.prisma.loanDiscrepancy.create({...});
    }
}
