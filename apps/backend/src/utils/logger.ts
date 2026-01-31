import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

export interface AuditLogEntry {
  action: string; // e.g., AI_RISK_ASSESSMENT
  actorId?: string;
  actorRole?: string;
  resource?: string; // e.g., flashloan:txPreview or loan:application
  outcome: 'APPROVE' | 'WARN' | 'BLOCK' | 'INFO' | 'ERROR';
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'lynq-backend' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
}) as winston.Logger & { audit?: (entry: AuditLogEntry) => void };

// Attach a convenience method for structured audit logs
logger.audit = (entry: AuditLogEntry) => {
  logger.info('AUDIT', entry as any);
};

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;

