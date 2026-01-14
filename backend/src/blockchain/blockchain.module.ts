import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { EventListenerService } from './events/event-listener.service';
import { ReconciliationService } from './reconciliation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule, ScheduleModule],
    controllers: [BlockchainController],
    providers: [BlockchainService, EventListenerService, ReconciliationService],
    exports: [BlockchainService],
})
export class BlockchainModule { }
