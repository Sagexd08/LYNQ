import { Injectable, Logger } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly limiters: Map<string, Map<string, RateLimitEntry>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {

    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }

  checkLimit(
    identifier: string,
    config: RateLimitConfig,
    limiterName: string = 'default',
  ): { allowed: boolean; remaining: number; resetAt: Date } {
    if (!this.limiters.has(limiterName)) {
      this.limiters.set(limiterName, new Map());
    }

    const limiter = this.limiters.get(limiterName)!;
    const now = Date.now();

    let entry = limiter.get(identifier);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      limiter.set(identifier, entry);
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetAt: new Date(entry.resetTime),
      };
    }

    entry.count++;

    const allowed = entry.count <= config.limit;
    const remaining = Math.max(0, config.limit - entry.count);
    const resetAt = new Date(entry.resetTime);

    if (!allowed) {
      this.logger.warn(
        `Rate limit exceeded for ${identifier} on ${limiterName}: ${entry.count}/${config.limit}`,
      );
    }

    return { allowed, remaining, resetAt };
  }

  reset(identifier: string, limiterName: string = 'default'): void {
    const limiter = this.limiters.get(limiterName);
    if (limiter) {
      limiter.delete(identifier);
      this.logger.debug(`Rate limit reset for ${identifier}`);
    }
  }

  resetAll(limiterName: string = 'default'): void {
    this.limiters.delete(limiterName);
    this.logger.log(`All rate limits reset for ${limiterName}`);
  }

  getStats(
    identifier: string,
    limiterName: string = 'default',
  ): RateLimitEntry | null {
    const limiter = this.limiters.get(limiterName);
    return limiter?.get(identifier) || null;
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [limiterName, limiter] of this.limiters) {
      const idsToDelete: string[] = [];

      for (const [id, entry] of limiter) {
        if (now > entry.resetTime) {
          idsToDelete.push(id);
        }
      }

      for (const id of idsToDelete) {
        limiter.delete(id);
      }

      if (idsToDelete.length > 0) {
        this.logger.debug(
          `Cleaned up ${idsToDelete.length} expired entries from ${limiterName}`,
        );
      }
    }
  }

  getMemoryStats(): {
    limiters: number;
    totalEntries: number;
    byLimiter: { [key: string]: number };
  } {
    let totalEntries = 0;
    const byLimiter: { [key: string]: number } = {};

    for (const [limiterName, limiter] of this.limiters) {
      const count = limiter.size;
      totalEntries += count;
      byLimiter[limiterName] = count;
    }

    return {
      limiters: this.limiters.size,
      totalEntries,
      byLimiter,
    };
  }
}
