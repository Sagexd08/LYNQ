import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReputationModule } from '../reputation/reputation.module';
import { RepaymentsController } from './repayments.controller';
import { RepaymentsService } from './repayments.service';

@Module({
  imports: [PrismaModule, ReputationModule],
  controllers: [RepaymentsController],
  providers: [RepaymentsService],
})
export class RepaymentsModule { }

