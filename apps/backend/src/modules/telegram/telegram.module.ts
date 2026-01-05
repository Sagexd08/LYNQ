import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './services/telegram.service';
import { TelegramController } from './controllers/telegram.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Global()
@Module({
    imports: [
        ConfigModule,
        forwardRef(() => SupabaseModule),
    ],
    controllers: [TelegramController],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule { }
