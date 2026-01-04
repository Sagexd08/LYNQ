import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';

@Injectable()
export class LoansService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createLoanDto: CreateLoanDto) {
        const { userId, amount, durationDays } = createLoanDto;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                reputation: true,
                loans: {
                    where: { status: 'active' },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.status === 'blocked') {
            throw new BadRequestException('User is blocked');
        }

        const reputation = user.reputation;
        if (!reputation) {
            // Should not happen if user creation always creates reputation
            throw new InternalServerErrorException('User reputation data is missing');
        }

        if (reputation.score < 30) {
            throw new BadRequestException(`Reputation score ${reputation.score} is too low (min 30 is required)`);
        }

        if (user.loans.length > 0) {
            throw new BadRequestException('User already has an active loan');
        }

        const maxLoanAmount = reputation.score * 20;
        if (amount > maxLoanAmount) {
            throw new BadRequestException(`Loan amount exceeds limit based on reputation. Max allowed: ${maxLoanAmount}`);
        }

        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + durationDays);

        return await this.prisma.loan.create({
            data: {
                userId,
                amount,
                dueAt,
                status: 'active',
            },
        });
    }

    async findOne(id: string) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: { user: true, repayments: true },
        });
        if (!loan) throw new NotFoundException('Loan not found');
        return loan;
    }
}
