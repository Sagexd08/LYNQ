import { Module } from '@nestjs/common';

import { IndexerService } from './indexer.service';
import { Loan } from '../loan/entities/loan.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
    imports: [

        UserModule,
    ],
    providers: [IndexerService],
    exports: [IndexerService],
})
export class IndexerModule { }
