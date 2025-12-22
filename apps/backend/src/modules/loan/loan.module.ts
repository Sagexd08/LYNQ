import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanController } from './controllers/loan.controller';
import { LoanService } from './services/loan.service';
import { Loan } from './entities/loan.entity';
import { Repayment } from './entities/repayment.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';
import { MLModule } from '../ml/ml.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Loan, Repayment]),
        UserModule,
        AuthModule,
        TelegramModule,
        forwardRef(() => MLModule),
    ],
    controllers: [LoanController],
    providers: [LoanService],
    exports: [LoanService, TypeOrmModule],
})
export class LoanModule { }

