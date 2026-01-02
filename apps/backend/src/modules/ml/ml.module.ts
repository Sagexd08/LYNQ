import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MLServiceClient } from './ml-service.client';
import { MLController } from './ml.controller';
import { MLService } from './ml.service';

@Module({
  imports: [ConfigModule],
  controllers: [MLController],
  providers: [MLServiceClient, MLService],
  exports: [MLServiceClient, MLService],
})
export class MLModule {}
