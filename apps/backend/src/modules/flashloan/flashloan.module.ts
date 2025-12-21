import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FlashLoanService } from './services/flash-loan.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
    imports: [ConfigModule, BlockchainModule],
    providers: [FlashLoanService],
    exports: [FlashLoanService],
})
export class FlashLoanModule { }
