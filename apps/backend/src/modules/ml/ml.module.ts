import { Module } from '@nestjs/common';
import { MLController } from './ml.controller';
import { MLService } from './ml.service';
import { UserModule } from '../user/user.module';
import { LoanModule } from '../loan/loan.module';

@Module({
  imports: [UserModule, LoanModule],
  controllers: [MLController],
  providers: [MLService],
})
export class MLModule { }
