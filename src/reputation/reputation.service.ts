import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReputationService {
    constructor(private readonly prisma: PrismaService) { }

    async getScore(userId: string) {
        const rep = await this.prisma.reputation.findUnique({
            where: { userId },
        });

        if (!rep) {
            throw new NotFoundException(`Reputation for user ${userId} not found`);
        }

        return rep;
    }
}
