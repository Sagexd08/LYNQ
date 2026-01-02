import { Module } from '@nestjs/common';

import { IndexerService } from './indexer.service';
import { UserModule } from '../user/user.module';

@Module({
    imports: [

        UserModule,
    ],
    providers: [IndexerService],
    exports: [IndexerService],
})
export class IndexerModule { }
