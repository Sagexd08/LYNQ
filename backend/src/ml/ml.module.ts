import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MlService } from './ml.service';
import { MlController } from './ml.controller';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('ML_SERVICE_URL'),
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': configService.get<string>('ML_API_KEY'),
        },
      }),
    }),
  ],
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
