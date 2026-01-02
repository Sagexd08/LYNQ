import { Module, forwardRef } from '@nestjs/common';
import { RiskScoringController } from './risk-scoring.controller';
import { RiskScoringService } from './risk-scoring.service';
import { UserModule } from '../user/user.module';
import { LoanModule } from '../loan/loan.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    UserModule,
    forwardRef(() => LoanModule),
    SupabaseModule
  ],
  controllers: [RiskScoringController],
  providers: [RiskScoringService],
  exports: [RiskScoringService],
})
export class RiskScoringModule { }
