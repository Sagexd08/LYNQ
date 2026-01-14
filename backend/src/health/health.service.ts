import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    mlService: ServiceHealth;
    blockchain: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'unknown';
  latencyMs?: number;
  message?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getHealth(): Promise<HealthCheck> {
    const [database, redis, mlService, blockchain] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMlService(),
      this.checkBlockchain(),
    ]);

    const services = { database, redis, mlService, blockchain };

    const allUp = Object.values(services).every((s) => s.status === 'up');
    const anyDown = Object.values(services).some((s) => s.status === 'down');

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (allUp) {
      status = 'healthy';
    } else if (anyDown) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: '1.0.0',
      services,
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return { status: 'unknown', message: 'Redis not configured' };
    }

    const start = Date.now();
    try {
      const Redis = require('ioredis');
      const redis = new Redis(redisUrl, { connectTimeout: 5000 });
      await redis.ping();
      await redis.quit();
      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkMlService(): Promise<ServiceHealth> {
    const mlUrl = this.configService.get<string>('ML_SERVICE_URL');
    if (!mlUrl) {
      return { status: 'unknown', message: 'ML service not configured' };
    }

    const start = Date.now();
    try {
      const response = await axios.get(`${mlUrl}/health`, { timeout: 5000 });
      return {
        status: response.data?.status === 'healthy' ? 'up' : 'down',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkBlockchain(): Promise<ServiceHealth> {
    const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
    if (!rpcUrl) {
      return { status: 'unknown', message: 'Blockchain RPC not configured' };
    }

    const start = Date.now();
    try {
      const response = await axios.post(
        rpcUrl,
        {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        },
        { timeout: 5000 },
      );

      if (response.data?.result) {
        return {
          status: 'up',
          latencyMs: Date.now() - start,
        };
      }
      return { status: 'down', message: 'Invalid response' };
    } catch (error) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }
}
