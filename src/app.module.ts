import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { LoansModule } from './loans/loans.module';
import { RepaymentsModule } from './repayments/repayments.module';
import { ReputationModule } from './reputation/reputation.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, UsersModule, LoansModule, RepaymentsModule, ReputationModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
