import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { SecretsVaultService } from '../modules/system/services/secrets-vault.service';
import * as readline from 'readline';

async function main() {
  const app = await NestFactory.create(AppModule);
  const vault = app.get(SecretsVaultService);
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'set':
        await handleSet(vault, args);
        break;

      case 'get':
        await handleGet(vault, args);
        break;

      case 'list':
        await handleList(vault);
        break;

      case 'rotate':
        await handleRotate(vault, args);
        break;

      case 'audit':
        await handleAudit(vault, args);
        break;

      case 'init-defaults':
        await handleInitDefaults(vault);
        break;

      case 'needs-rotation':
        await handleNeedsRotation(vault);
        break;

      default:
        printHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  await app.close();
}

async function handleSet(vault: SecretsVaultService, args: string[]) {
  if (args.length < 2) {
    console.error('Usage: npm run cli -- set <key> <value> [rotationDays]');
    process.exit(1);
  }

  const [key, value, rotationDays] = args;
  const maxAge = rotationDays ? parseInt(rotationDays) : undefined;

  await vault.setSecret(key, value, maxAge);
  console.log(`✅ Secret "${key}" stored successfully`);

  if (maxAge) {
    console.log(`   Rotation policy: Every ${maxAge} days`);
  }
}

async function handleGet(vault: SecretsVaultService, args: string[]) {
  if (args.length < 1) {
    console.error('Usage: npm run cli -- get <key>');
    process.exit(1);
  }

  const key = args[0];
  const value = await vault.getSecret(key, 'CLI');
  console.log(`✅ Secret "${key}" retrieved (value hidden for security)`);
  console.log(`   Length: ${value.length} characters`);
  console.log(`   First 4 chars: ${value.substring(0, 4)}...`);
}

async function handleList(vault: SecretsVaultService) {
  const keys = await vault.getSecretKeys();

  if (keys.length === 0) {
    console.log('No secrets found in vault');
    return;
  }

  console.log(`📦 Secrets in vault (${keys.length} total):\n`);

  for (const key of keys) {
    const log = await vault.getAuditLog(key);
    const lastAccess = log.length > 0 ? new Date(log[log.length - 1].timestamp).toLocaleString() : 'Never';
    console.log(`  • ${key}`);
    console.log(`    Last accessed: ${lastAccess}`);
    console.log(`    Total accesses: ${log.length}`);
  }
}

async function handleRotate(vault: SecretsVaultService, args: string[]) {
  if (args.length < 2) {
    console.error('Usage: npm run cli -- rotate <key> <newValue>');
    process.exit(1);
  }

  const [key, newValue] = args;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`Are you sure you want to rotate "${key}"? (yes/no): `, async (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('Rotation cancelled');
      rl.close();
      process.exit(0);
    }

    try {
      await vault.rotateSecret(key, newValue);
      console.log(`✅ Secret "${key}" rotated successfully`);
    } catch (error) {
      console.error(`❌ Rotation failed: ${error.message}`);
    }

    rl.close();
  });
}

async function handleAudit(vault: SecretsVaultService, args: string[]) {
  if (args.length < 1) {
    console.error('Usage: npm run cli -- audit <key>');
    process.exit(1);
  }

  const key = args[0];
  const log = await vault.getAuditLog(key);

  if (log.length === 0) {
    console.log(`No audit entries for "${key}"`);
    return;
  }

  console.log(`📋 Audit log for "${key}"\n`);

  for (const entry of log) {
    const timestamp = new Date(entry.timestamp).toISOString();
    console.log(`  [${timestamp}] ${entry.action} by ${entry.accessor}`);
    if (entry.source) {
      console.log(`                Source: ${entry.source}`);
    }
  }

  console.log(`\nTotal entries: ${log.length}`);
}

async function handleNeedsRotation(vault: SecretsVaultService) {
  const needsRotation = await vault.getSecretsNeedingRotation();

  if (needsRotation.length === 0) {
    console.log('✅ No secrets need rotation');
    return;
  }

  console.log(`⚠️  Secrets needing rotation (${needsRotation.length}):\n`);
  for (const key of needsRotation) {
    console.log(`  • ${key}`);
  }
}

async function handleInitDefaults(vault: SecretsVaultService) {
  console.log('🔧 Initializing secrets from environment variables...\n');

  const secretKeys = [
    'LIQUIDATOR_PRIVATE_KEY',
    'FLASH_LOAN_OPERATOR_PRIVATE_KEY',
    'PRIVATE_KEY',
  ];

  for (const key of secretKeys) {
    const value = process.env[key];

    if (!value) {
      console.log(`⏭️  Skipping ${key} (not set in .env)`);
      continue;
    }

    try {

      await vault.setSecret(key, value, 90);
      console.log(`✅ ${key} stored with 90-day rotation policy`);
    } catch (error) {
      console.error(`❌ Failed to store ${key}: ${error.message}`);
    }
  }

  console.log('\n🎉 Secrets initialization complete!');
  console.log('Now remove or clear the private keys from your .env file for security.');
}

function printHelp() {
  console.log(`
🔐 LYNQ Secrets Vault CLI

Usage:
  npm run cli -- <command> [arguments]

Commands:
  set <key> <value> [rotationDays]    Store a secret (optionally with rotation policy)
  get <key>                           Retrieve a secret (masked display)
  list                                List all secrets in vault
  rotate <key> <newValue>             Rotate a secret to a new value
  audit <key>                         View audit log for a secret
  needs-rotation                      List secrets needing rotation
  init-defaults                       Initialize secrets from .env file

Examples:
  # Store a private key with 90-day rotation
  npm run cli -- set LIQUIDATOR_PRIVATE_KEY "0x..." 90

  # List all secrets
  npm run cli -- list

  # View audit trail
  npm run cli -- audit LIQUIDATOR_PRIVATE_KEY

  # Initialize from environment
  npm run cli -- init-defaults
  `);
}

main().catch(console.error);
