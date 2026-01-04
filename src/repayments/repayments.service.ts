import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';

@Injectable()
export class RepaymentsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createRepaymentDto: CreateRepaymentDto) {
        const { loanId, amount } = createRepaymentDto;

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

        // Create repayment record
        const repayment = await this.prisma.repayment.create({
            data: {
                loanId,
                amount,
            },
        });

        // Check if fully repaid
        const totalRepaid = loan.repayments.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0) + amount;

        if (totalRepaid >= loan.amount) {
            // Mark loan as repaid
            await this.prisma.loan.update({
                where: { id: loanId },
                data: { status: 'repaid' },
            });

            // Update reputation
            if (loan.user && loan.user.reputation) {
                const isOverdue = new Date() > loan.dueAt;
                const scoreChange = isOverdue ? -20 : 10;
                let newScore = loan.user.reputation.score + scoreChange;

                // Clamp score
                if (newScore > 100) newScore = 100;
                if (newScore < 0) newScore = 0;

                await this.prisma.reputation.update({
                    where: { userId: loan.userId },
                    data: { score: newScore },
                });
            }
        }

        return repayment;
    }
}
