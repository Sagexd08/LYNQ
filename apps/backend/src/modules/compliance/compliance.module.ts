import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { BlacklistService } from './blacklist.service';

@Module({
  imports: [ConfigModule, SupabaseModule],
  providers: [BlacklistService],
  exports: [BlacklistService],
})
export class ComplianceModule {}
