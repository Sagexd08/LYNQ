import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

/**
 * Device Fingerprint Middleware
 * - Computes a SHA-256 fingerprint from IP + user-agent + x-device-id
 * - Attaches to req.fingerprint
 * - Persists an audit log entry to DB (AuditLog)
 * - Flags anomalies (changes across requests) using an in-memory cache
 */

// Simple in-memory cache for last fingerprints per (userId or wallet)
const lastFingerprintCache = new Map<string, string>();
const prisma = new PrismaClient();

export interface FingerprintedRequest extends AuthRequest {
  fingerprint?: string;
  fingerprintAnomaly?: boolean;
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getClientIp(req: Request): string {
  // Trust common proxy headers if present
  const xff = (req.headers['x-forwarded-for'] || '') as string;
  const forwardedIp = xff.split(',')[0].trim();
  return forwardedIp || (req.socket && (req.socket.remoteAddress || '')) || req.ip || '';
}

export const deviceFingerprint = async (
  req: FingerprintedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = getClientIp(req);
    const userAgent = (req.headers['user-agent'] as string) || '';
    const deviceId = (req.headers['x-device-id'] as string) || '';

    const identity = req.userId || req.walletAddress || 'anonymous';

    // Build fingerprint: include identity for stronger binding
    const raw = `${ip}|${userAgent}|${deviceId}|${identity}`;
    const fingerprint = sha256Hex(raw);

    req.fingerprint = fingerprint;

    const cacheKey = identity;
    const last = lastFingerprintCache.get(cacheKey);
    const anomaly = !!(last && last !== fingerprint);
    req.fingerprintAnomaly = anomaly;

    // Update cache
    lastFingerprintCache.set(cacheKey, fingerprint);

    // Emit audit log (file-based)
    logger.audit?.({
      action: 'DEVICE_FINGERPRINT',
      outcome: anomaly ? 'WARN' : 'INFO',
      resource: 'security:fingerprint',
      metadata: {
        identity,
        ip,
        deviceId: deviceId ? 'present' : 'missing',
        userAgentHash: sha256Hex(userAgent),
        fingerprint,
        anomaly,
      },
    });

    // Persist to DB (AuditLog) best-effort, non-blocking
    // Note: If no user is identified, store null userId
    prisma.auditLog
      .create({
        data: {
          userId: identity !== 'anonymous' ? identity : null,
          action: 'DEVICE_FINGERPRINT',
          resource: 'security:fingerprint',
          details: {
            ip,
            deviceIdPresent: !!deviceId,
            userAgentHash: sha256Hex(userAgent),
            fingerprint,
            anomaly,
          },
          ipAddress: ip,
          userAgent: userAgent.substring(0, 512),
        },
      })
      .catch((e) => {
        logger.warn('Failed to persist device fingerprint audit to DB', { error: e?.message });
      });

    // If anomaly detected, optionally add a response header for clients
    if (anomaly) {
      res.setHeader('X-Fingerprint-Anomaly', '1');
    }

    next();
  } catch (err: any) {
    logger.warn('Device fingerprint middleware error', { error: err?.message });
    // Do not block request on fingerprint failure
    next();
  }
};

export default deviceFingerprint;
