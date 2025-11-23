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

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '7d';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3001';

  @IsString()
  @IsOptional()
  ADMIN_URL: string = 'http://localhost:3002';

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

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsOptional()
  DATA_KEY: string = '';

  @IsString()
  @IsOptional()
  DATA_KEY_PREV: string = '';

  @IsString()
  @IsOptional()
  TELEGRAM_BOT_TOKEN: string = '';

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
