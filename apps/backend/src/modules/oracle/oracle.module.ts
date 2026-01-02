import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OracleService } from './oracle.service';

@Module({
  imports: [ConfigModule],
  providers: [OracleService],
  exports: [OracleService],
})
export class OracleModule {}
