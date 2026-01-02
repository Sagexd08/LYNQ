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

    @IsString()
    @IsOptional()
    SUPABASE_URL?: string;

    @IsString()
    @IsOptional()
    SUPABASE_KEY?: string;

    @IsString()
    @IsOptional()
    SUPABASE_SERVICE_ROLE_KEY?: string;

    
    @IsString()
    @IsOptional()
    PRIVATE_KEY?: string;

    @IsString()
    @IsOptional()
    FLASH_LOAN_OPERATOR_PRIVATE_KEY?: string;

    @IsString()
    @IsOptional()
    RPC_URL?: string;

    @IsNumber()
    @IsOptional()
    CHAIN_ID?: number;

    @IsString()
    @IsOptional()
    CREDIT_SCORE_VERIFIER_ADDRESS?: string;

    
    @IsString()
    @IsOptional()
    JWT_SECRET?: string;

    @IsString()
    @IsOptional()
    JWT_EXPIRATION?: string;
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

    
    if (validatedConfig.NODE_ENV === Environment.Production) {
        const sensitiveKeys = ['PRIVATE_KEY', 'FLASH_LOAN_OPERATOR_PRIVATE_KEY', 'JWT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY'];
        const missingSensitive: string[] = [];

        for (const key of sensitiveKeys) {
            if (!config[key]) {
                missingSensitive.push(key);
            }
        }

        if (missingSensitive.length > 0) {
            console.warn('⚠️  SECURITY WARNING: Missing sensitive environment variables in production:');
            console.warn(`   ${missingSensitive.join(', ')}`);
            console.warn('   Application may not function correctly or securely.');
        }

        
        if (config['JWT_SECRET'] === 'your-secret-key' || config['JWT_SECRET'] === 'secret') {
            console.error('❌ CRITICAL: Using default JWT_SECRET in production! This is a severe security risk.');
            throw new Error('Default JWT_SECRET not allowed in production');
        }

        
        if (config['PRIVATE_KEY']) {
            console.warn('⚠️  SECURITY WARNING: PRIVATE_KEY detected in environment variables.');
            console.warn('   Consider using a secrets management service (AWS Secrets Manager, Vault, etc.)');
            console.warn('   Never commit private keys to version control.');
        }
    }

    return validatedConfig;
}
