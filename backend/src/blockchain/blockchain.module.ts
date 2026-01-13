import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { EventListenerService } from './events/event-listener.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [BlockchainController],
    providers: [BlockchainService, EventListenerService],
    exports: [BlockchainService],
})
export class BlockchainModule { }
