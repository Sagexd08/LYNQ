import { Module, forwardRef } from '@nestjs/common';

import { LoanController } from './controllers/loan.controller';
import { LoanService } from './services/loan.service';
import { LoanEligibilityService } from './services/loan-eligibility.service';


import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';
import { RiskScoringModule } from '../risk-scoring/risk-scoring.module';

@Module({
    imports: [

        UserModule,
        AuthModule,
        TelegramModule,
        forwardRef(() => RiskScoringModule),
    ],
    controllers: [LoanController],
    providers: [LoanService, LoanEligibilityService],
    exports: [LoanService, LoanEligibilityService],
})
export class LoanModule { }

