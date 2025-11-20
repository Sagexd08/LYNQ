import { plainToClass } from 'class-transformer';
import { IsString, IsNumber, IsOptional, validateSync, IsEnum } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  // Database
  @IsString()
  DB_HOST!: string;

  @IsNumber()
  @IsOptional()
  DB_PORT: number = 5432;

  @IsString()
  DB_USER!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_NAME!: string;

  // JWT
  @IsString()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '7d';

  // CORS
  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3001';

  @IsString()
  @IsOptional()
  ADMIN_URL: string = 'http://localhost:3002';

  // Blockchain
  @IsString()
  @IsOptional()
  ETHEREUM_RPC_URL: string = '';

  @IsString()
  @IsOptional()
  FLASH_LOAN_CONTRACT_ADDRESS: string = '';

  @IsString()
  @IsOptional()
  FLASH_LOAN_OPERATOR_PRIVATE_KEY: string = '';

  @IsString()
  @IsOptional()
  PRIVATE_KEY: string = '';

  // Logging
  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  // Data encryption
  @IsString()
  @IsOptional()
  DATA_KEY: string = '';

  @IsString()
  @IsOptional()
  DATA_KEY_PREV: string = '';

  // Telegram (optional)
  @IsString()
  @IsOptional()
  TELEGRAM_BOT_TOKEN: string = '';

  // Sentry (optional)
  @IsString()
  @IsOptional()
  SENTRY_DSN: string = '';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
