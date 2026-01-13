import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReputationService } from '../reputation/reputation.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { classifyRepayment, RepaymentClassification } from './classification';

const PARTIAL_EXTENSION_DAYS = 3;

@Injectable()
export class RepaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly reputationService: ReputationService,
    ) { }

    async create(createRepaymentDto: CreateRepaymentDto) {
        const { loanId, amount } = createRepaymentDto;
        const paidAt = new Date();

        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                repayments: true,
                user: {
                    include: { reputation: true },
                },
            },
        });

        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        if (loan.status === 'repaid') {
            throw new BadRequestException('Loan is already repaid');
        }

        const outcome = classifyRepayment(loan, amount, paidAt);

        return this.prisma.$transaction(async (tx) => {
            const repayment = await tx.repayment.create({
                data: {
                    loanId,
                    amount,
                },
            });

            if (outcome.classification === RepaymentClassification.PARTIAL) {
                if (loan.partialExtensionUsed) {
                    await tx.loan.update({
                        where: { id: loanId },
                        data: {
                            lateDays: Math.max(1, outcome.lateDays),
                        },
                    });

                    if (loan.user?.reputation) {
                        await this.reputationService.applyRepaymentOutcome(
                            loan.userId,
                            RepaymentClassification.LATE,
                            1,
                            loanId
                        );
                    }
                } else {
                    const newDueAt = new Date(loan.dueAt);
                    newDueAt.setDate(newDueAt.getDate() + PARTIAL_EXTENSION_DAYS);

                    await tx.loan.update({
                        where: { id: loanId },
                        data: {
                            partialExtensionUsed: true,
                            dueAt: newDueAt,
                        },
                    });
                }

                return repayment;
            }

            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: 'repaid',
                    lateDays: outcome.lateDays,
                },
            });

            if (loan.user?.reputation) {
                await this.reputationService.applyRepaymentOutcome(
                    loan.userId,
                    outcome.classification,
                    outcome.lateDays,
                    loanId
                );
            }

            return repayment;
        });
    }
}
