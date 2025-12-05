import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

interface SecretEntry {
  key: string;
  value: string;
  createdAt: number;
  updatedAt: number;
  accessLog: AccessLog[];
  rotationPolicy?: {
    maxAgeDays: number;
    lastRotated: number;
  };
}

interface AccessLog {
  timestamp: number;
  accessor: string;
  action: 'READ' | 'UPDATE' | 'DELETE' | 'ROTATE';
  source?: string;
}

@Injectable()
export class SecretsVaultService implements OnModuleInit {
  private readonly logger = new Logger(SecretsVaultService.name);
  private vault: Map<string, SecretEntry> = new Map();
  private vaultPath: string;
  private encryptionKey: string;
  private readonly VAULT_FILENAME = '.vault.enc';
  private readonly AUDIT_LOG_FILENAME = 'vault-audit.log';

  constructor(private configService: ConfigService) {
    this.vaultPath = path.join(process.cwd(), this.VAULT_FILENAME);
  }

  async onModuleInit(): Promise<void> {
    this.encryptionKey = this.configService.get<string>(
      'VAULT_ENCRYPTION_KEY',
      crypto.randomBytes(32).toString('hex'),
    );

    await this.loadVault();
    this.logger.log('✅ Secrets Vault initialized');
  }

  async setSecret(
    key: string,
    value: string,
    rotationMaxAgeDays?: number,
  ): Promise<void> {
    const entry: SecretEntry = {
      key,
      value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accessLog: [
        {
          timestamp: Date.now(),
          accessor: 'SYSTEM',
          action: 'UPDATE',
        },
      ],
      rotationPolicy: rotationMaxAgeDays
        ? { maxAgeDays: rotationMaxAgeDays, lastRotated: Date.now() }
        : undefined,
    };

    this.vault.set(key, entry);
    await this.saveVault();
    await this.logAuditEvent(key, 'UPDATE', 'SYSTEM');
    this.logger.debug(`Secret "${key}" stored with encryption`);
  }

  async getSecret(key: string, accessor: string = 'UNKNOWN'): Promise<string> {
    const entry = this.vault.get(key);

    if (!entry) {
      this.logger.warn(`Secret "${key}" not found in vault`);
      await this.logAuditEvent(key, 'READ', accessor, 'NOT_FOUND');
      throw new Error(`Secret "${key}" not found`);
    }

    if (entry.rotationPolicy) {
      const ageMs = Date.now() - entry.rotationPolicy.lastRotated;
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays > entry.rotationPolicy.maxAgeDays) {
        this.logger.warn(
          `Secret "${key}" requires rotation (age: ${ageDays.toFixed(2)} days)`,
        );
      }
    }

    entry.accessLog.push({
      timestamp: Date.now(),
      accessor,
      action: 'READ',
    });

    await this.logAuditEvent(key, 'READ', accessor);
    return entry.value;
  }

  async rotateSecret(key: string, newValue: string): Promise<void> {
    const entry = this.vault.get(key);

    if (!entry) {
      throw new Error(`Secret "${key}" not found`);
    }

    entry.value = newValue;
    entry.updatedAt = Date.now();

    if (entry.rotationPolicy) {
      entry.rotationPolicy.lastRotated = Date.now();
    }

    entry.accessLog.push({
      timestamp: Date.now(),
      accessor: 'SYSTEM',
      action: 'ROTATE',
    });

    await this.saveVault();
    await this.logAuditEvent(key, 'ROTATE', 'SYSTEM');
    this.logger.log(`Secret "${key}" rotated successfully`);
  }

  async deleteSecret(key: string): Promise<void> {
    if (!this.vault.has(key)) {
      throw new Error(`Secret "${key}" not found`);
    }

    this.vault.delete(key);
    await this.saveVault();
    await this.logAuditEvent(key, 'DELETE', 'SYSTEM');
    this.logger.log(`Secret "${key}" deleted`);
  }

  async getSecretKeys(): Promise<string[]> {
    return Array.from(this.vault.keys());
  }

  async getAuditLog(key: string): Promise<AccessLog[]> {
    const entry = this.vault.get(key);
    return entry?.accessLog || [];
  }

  async needsRotation(key: string): Promise<boolean> {
    const entry = this.vault.get(key);

    if (!entry || !entry.rotationPolicy) {
      return false;
    }

    const ageMs = Date.now() - entry.rotationPolicy.lastRotated;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    return ageDays > entry.rotationPolicy.maxAgeDays;
  }

  async getSecretsNeedingRotation(): Promise<string[]> {
    const needsRotation: string[] = [];

    for (const [key] of this.vault) {
      if (await this.needsRotation(key)) {
        needsRotation.push(key);
      }
    }

    return needsRotation;
  }

  private async saveVault(): Promise<void> {
    try {
      const vaultData = Array.from(this.vault.entries()).map(([key, entry]) => ({
        key,
        ...entry,
      }));

      const jsonData = JSON.stringify(vaultData);

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        Buffer.from(this.encryptionKey, 'hex').slice(0, 32),
        iv,
      );

      let encrypted = cipher.update(jsonData, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      const vault = {
        version: '1',
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        data: encrypted,
      };

      fs.writeFileSync(this.vaultPath, JSON.stringify(vault, null, 2), {
        mode: 0o600,
      });

      this.logger.debug('Vault encrypted and saved to disk');
    } catch (error) {
      this.logger.error('Failed to save vault', error);
      throw error;
    }
  }

  private async loadVault(): Promise<void> {
    try {
      if (!fs.existsSync(this.vaultPath)) {
        this.logger.log('No existing vault found, creating new vault');
        return;
      }

      const vaultFile = fs.readFileSync(this.vaultPath, 'utf-8');
      const vault = JSON.parse(vaultFile);

      if (vault.version !== '1') {
        throw new Error('Unsupported vault version');
      }

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(this.encryptionKey, 'hex').slice(0, 32),
        Buffer.from(vault.iv, 'hex'),
      );

      decipher.setAuthTag(Buffer.from(vault.authTag, 'hex'));

      let decrypted = decipher.update(vault.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const vaultData = JSON.parse(decrypted);

      for (const entry of vaultData) {
        this.vault.set(entry.key, {
          key: entry.key,
          value: entry.value,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          accessLog: entry.accessLog || [],
          rotationPolicy: entry.rotationPolicy,
        });
      }

      this.logger.log(`✅ Vault loaded with ${this.vault.size} secrets`);
    } catch (error) {
      this.logger.error('Failed to load vault', error);

      this.logger.warn('Starting with empty vault. Add secrets manually.');
    }
  }

  private async logAuditEvent(
    key: string,
    action: string,
    accessor: string,
    status?: string,
  ): Promise<void> {
    try {
      const auditPath = path.join(
        process.cwd(),
        'logs',
        this.AUDIT_LOG_FILENAME,
      );

      const logsDir = path.dirname(auditPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] action=${action} key=${key} accessor=${accessor} ${status ? `status=${status}` : ''}`;

      fs.appendFileSync(auditPath, logEntry + '\n');
    } catch (error) {
      this.logger.error('Failed to write audit log', error);
    }
  }

  async exportVault(): Promise<string> {
    return fs.readFileSync(this.vaultPath, 'utf-8');
  }

  async importVault(encryptedData: string): Promise<void> {
    try {
      const vault = JSON.parse(encryptedData);
      fs.writeFileSync(this.vaultPath, JSON.stringify(vault, null, 2), {
        mode: 0o600,
      });

      await this.loadVault();
      this.logger.log('Vault imported successfully');
    } catch (error) {
      this.logger.error('Failed to import vault', error);
      throw error;
    }
  }
}
