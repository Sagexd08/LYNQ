import { Module } from '@nestjs/common';
import { CollateralService } from './collateral.service';
import { CollateralController } from './collateral.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CollateralController],
    providers: [CollateralService],
    exports: [CollateralService],
})
export class CollateralModule { }
