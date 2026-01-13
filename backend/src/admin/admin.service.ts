import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async findAllUsers() {
        return this.prisma.user.findMany({
            include: {
                reputation: true,
                loans: true,
            },
        });
    }

    async setUserStatus(id: string, isBlocked: boolean) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { status: isBlocked ? 'blocked' : 'active' },
        });
        return user;
    }

    async updateReputation(userId: string, score: number) {
        if (score < 0) score = 0;
        if (score > 100) score = 100;

        return await this.prisma.reputation.update({
            where: { userId },
            data: { score },
        });
    }

    async simulateOverdue(loanId: string) {
        const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
        if (!loan) throw new NotFoundException('Loan not found');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return await this.prisma.loan.update({
            where: { id: loanId },
            data: {
                dueAt: yesterday,
                status: 'overdue' // Explicitly set status for clarity though dueAt implies it
            },
        });
    }
}
