import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
  ) {}

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

    if (loan.status === 'REPAID') {
      throw new BadRequestException('Loan is already repaid');
    }
    if (!loan.dueDate) {
      throw new BadRequestException(
        'Loan dueDate is required for repayment classification',
      );
    }

    // Create a compatible loan object for classification
    const loanForClassification = {
      amount: Number(loan.amount),
      dueAt: loan.dueDate,
      repayments: loan.repayments.map((r) => ({ amount: Number(r.amount) })),
      partialExtensionUsed: loan.partialExtensionUsed || false,
    };

    const outcome = classifyRepayment(loanForClassification, amount, paidAt);

    return this.prisma.$transaction(async (tx) => {
      const repayment = await tx.repayments.create({
        data: {
          loanId,
          userId: loan.userId,
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
              loanId,
            );
          }
        } else {
          const newDueDate = new Date(loan.dueDate!);
          newDueDate.setDate(newDueDate.getDate() + PARTIAL_EXTENSION_DAYS);

          await tx.loan.update({
            where: { id: loanId },
            data: {
              partialExtensionUsed: true,
              dueDate: newDueDate,
            },
          });
        }

        return repayment;
      }

      await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'REPAID',
          lateDays: outcome.lateDays,
        },
      });

      if (loan.user?.reputation) {
        await this.reputationService.applyRepaymentOutcome(
          loan.userId,
          outcome.classification,
          outcome.lateDays,
          loanId,
        );
      }

      return repayment;
    });
  }
}
