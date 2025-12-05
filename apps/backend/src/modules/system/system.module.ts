import { Module } from '@nestjs/common';
import { SecretsVaultService } from './services/secrets-vault.service';
import { RateLimiterService } from './services/rate-limiter.service';

@Module({
  providers: [SecretsVaultService, RateLimiterService],
  exports: [SecretsVaultService, RateLimiterService],
})
export class SystemModule {}
