import { Module, Global } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('24h'),

  ML_SERVICE_URL: z.string().url().default('http://localhost:5000'),
  ML_API_KEY: z.string().min(8),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  BLOCKCHAIN_RPC_URL: z.string().url().optional(),
  BLOCKCHAIN_RPC_URL_POLYGON: z.string().url().optional(),
  MANTLE_SEPOLIA_RPC_URL: z.string().url().optional(),
  PRIVATE_KEY: z.string().optional(),
  LOAN_CORE_ADDRESS: z.string().optional(),
  COLLATERAL_VAULT_ADDRESS: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
