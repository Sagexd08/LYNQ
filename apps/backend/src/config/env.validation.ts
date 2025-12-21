import { plainToClass } from 'class-transformer';
import { IsNumber, IsOptional, IsString, validateSync, IsEnum, IsBooleanString } from 'class-validator';

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
    @IsOptional()
    DB_HOST: string = 'localhost';

    @IsNumber()
    @IsOptional()
    DB_PORT: number = 5432;

    @IsString()
    @IsOptional()
    DB_USER: string = 'postgres';

    @IsString()
    @IsOptional()
    DB_PASSWORD: string = 'postgres';

    @IsString()
    @IsOptional()
    DB_NAME: string = 'lynq';

    @IsString()
    @IsOptional()
    TELEGRAM_BOT_TOKEN: string = '';

    @IsString()
    @IsOptional()
    FRONTEND_URL?: string;

    @IsString()
    @IsOptional()
    ADMIN_URL?: string;

    @IsString()
    @IsOptional()
    CORS_ORIGINS?: string;

    @IsString()
    @IsOptional()
    SENTRY_DSN?: string;

    @IsString()
    @IsOptional()
    LOG_LEVEL?: string;

    @IsBooleanString()
    @IsOptional()
    ENABLE_SWAGGER?: string;
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
