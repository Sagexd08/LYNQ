import { Module } from '@nestjs/common';
import { RiskService } from './risk.service';
import { RiskController } from './risk.controller';
import { MlModule } from '../ml/ml.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [MlModule, PrismaModule],
    controllers: [RiskController],
    providers: [RiskService],
    exports: [RiskService],
})
export class RiskModule { }
