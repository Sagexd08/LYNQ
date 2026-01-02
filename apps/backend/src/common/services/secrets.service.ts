import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class SecretsService implements OnModuleInit {
  private readonly logger = new Logger(SecretsService.name);
  private readonly secrets: Map<string, string> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.loadSecrets();
    this.validateCriticalSecrets();
  }

  
  private loadSecrets() {
    const secretKeys = [
      'PRIVATE_KEY',
      'FLASH_LOAN_OPERATOR_PRIVATE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'TELEGRAM_BOT_TOKEN',
    ];

    for (const key of secretKeys) {
      const value = this.configService.get<string>(key);
      if (value) {
        this.secrets.set(key, value);
        this.logger.log(`✓ Loaded secret: ${key}`);
      } else {
        this.logger.warn(`⚠ Missing secret: ${key}`);
      }
    }
  }

  
  private validateCriticalSecrets() {
    const criticalSecrets = ['SUPABASE_SERVICE_ROLE_KEY'];
    const missing: string[] = [];

    for (const key of criticalSecrets) {
      if (!this.secrets.has(key)) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      this.logger.error(
        `❌ CRITICAL: Missing required secrets: ${missing.join(', ')}`,
      );
      this.logger.error(
        'Application may not function correctly. Please set these environment variables.',
      );
    }
  }

  
  getSecret(key: string, required: boolean = false): string | undefined {
    const value = this.secrets.get(key);

    if (!value && required) {
      throw new Error(
        `Required secret '${key}' not found. Please configure this in your environment variables or secrets vault.`,
      );
    }

    if (!value) {
      this.logger.warn(
        `Secret '${key}' requested but not found. Returning undefined.`,
      );
    }

    return value;
  }

  
  getPrivateKey(keyType: 'default' | 'flash_loan_operator' = 'default'): string {
    const keyMap = {
      default: 'PRIVATE_KEY',
      flash_loan_operator: 'FLASH_LOAN_OPERATOR_PRIVATE_KEY',
    };

    const secretKey = keyMap[keyType];
    const privateKey = this.getSecret(secretKey, true);

    if (!privateKey) {
      throw new Error(
        `Private key '${secretKey}' not configured. ` +
        'SECURITY WARNING: Never commit private keys to version control. ' +
        'Use environment variables or a secrets management service.',
      );
    }

    
    if (!this.isValidPrivateKey(privateKey)) {
      throw new Error(
        `Invalid private key format for '${secretKey}'. ` +
        'Expected a 64-character hexadecimal string (with or without 0x prefix).',
      );
    }

    return privateKey;
  }

  
  private isValidPrivateKey(key: string): boolean {
    
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
    
    
    return /^[0-9a-fA-F]{64}$/.test(cleanKey);
  }

  
  hasSecret(key: string): boolean {
    return this.secrets.has(key);
  }

  
  getConfiguredSecrets(): string[] {
    return Array.from(this.secrets.keys());
  }

  
  private auditSecretAccess(key: string, accessor: string) {
    this.logger.log(
      `Secret accessed: ${key} by ${accessor} at ${new Date().toISOString()}`,
    );
    
  }
}


