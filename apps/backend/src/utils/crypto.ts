import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface CipherPayload {
  alg: 'AES-256-GCM';
  kid: 'primary' | 'previous';
  iv: string;
  tag: string;
  ciphertext: string;
}

let primaryKey: Buffer | null = null;
let previousKey: Buffer | null = null;

export function initCrypto(config: ConfigService): void {
  const primary = config.get<string>('DATA_KEY');
  if (!primary) throw new Error('Missing DATA_KEY configuration');
  primaryKey = parseKey(primary);
  if (primaryKey.length !== 32) throw new Error('DATA_KEY must be 32 bytes');
  const prev = config.get<string>('DATA_KEY_PREV');
  if (prev) {
    previousKey = parseKey(prev);
    if (previousKey.length !== 32) throw new Error('DATA_KEY_PREV must be 32 bytes');
  }
}

function loadKey(): { key: Buffer; kid: 'primary' } {
  if (!primaryKey) throw new Error('Crypto not initialized');
  return { key: primaryKey, kid: 'primary' };
}

function loadPrevKey(): { key: Buffer; kid: 'previous' } | null {
  if (!previousKey) return null;
  return { key: previousKey, kid: 'previous' };
}

function parseKey(v: string): Buffer {
  const s = v.trim();
  if (/^[A-Fa-f0-9]+$/.test(s) && (s.length === 64)) {
    return Buffer.from(s, 'hex');
  }
  return Buffer.from(s, 'base64');
}

export function encryptJSON(obj: unknown): CipherPayload {
  const { key, kid } = loadKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    alg: 'AES-256-GCM',
    kid,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptJSON(payload: CipherPayload): any {
  const primary = loadKey();
  const prev = loadPrevKey();

  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');

  const keys = [primary, prev].filter(Boolean) as Array<{ key: Buffer; kid: string }>;

  for (const k of keys) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', k.key, iv);
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return JSON.parse(plain.toString('utf8'));
    } catch (e) {
    }
  }
  throw new Error('Failed to decrypt with available keys');
}

export function reencrypt(payload: CipherPayload): CipherPayload {
  const data = decryptJSON(payload);
  return encryptJSON(data);
}
