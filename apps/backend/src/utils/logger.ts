import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { ConfigService } from '@nestjs/config';

const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

export interface AuditLogEntry {
  action: string;
  actorId?: string;
  actorRole?: string;
  resource?: string;
  outcome: 'APPROVE' | 'WARN' | 'BLOCK' | 'INFO' | 'ERROR';
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

let logLevel = 'info';
let nodeEnv = 'development';

export function initLogger(config: ConfigService): void {
  logLevel = config.get<string>('LOG_LEVEL', 'info');
  nodeEnv = config.get<string>('NODE_ENV', 'development');
  
  logger.level = logLevel;
  
  if (nodeEnv !== 'production' && !logger.transports.some(t => t instanceof winston.transports.Console)) {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }));
  }
}

const logger = winston.createLogger({
  level: logLevel,
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

logger.audit = (entry: AuditLogEntry) => {
  logger.info('AUDIT', entry as any);
};

export default logger;

