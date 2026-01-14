import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RiskService } from './risk.service';
import { RiskController } from './risk.controller';
import { MlModule } from '../ml/ml.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SignatureService } from './signature.service';

@Module({
    imports: [MlModule, PrismaModule, ConfigModule],
    controllers: [RiskController],
    providers: [RiskService, SignatureService],
    exports: [RiskService, SignatureService],
})
export class RiskModule { }

