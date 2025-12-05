import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RateLimiterService } from '../../modules/system/services/rate-limiter.service';
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private rateLimiterService: RateLimiterService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const config = this.getConfig(context);
    const identifier = this.getIdentifier(request, config);

    const result = this.rateLimiterService.checkLimit(
      identifier,
      { limit: config.limit, windowMs: config.windowMs },
      config.limiterName || 'default',
    );

    response.setHeader('X-RateLimit-Limit', config.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(result.resetAt.getTime() / 1000),
    );

    if (!result.allowed) {
      const message = config.message || `Too many requests. Try again in ${Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)} seconds`;
      this.logger.warn(`Rate limit exceeded for ${identifier}: ${message}`);
      throw new BadRequestException(message);
    }

    return true;
  }

  private getConfig(context: ExecutionContext): RateLimitOptions & { limiterName?: string } {
    const handler = context.getHandler();
    const metadata = Reflect.getMetadata('rateLimitConfig', handler) || {};

    return {
      limit: metadata.limit || 100,
      windowMs: metadata.windowMs || 60 * 1000,
      message: metadata.message,
      skipSuccessfulRequests: metadata.skipSuccessfulRequests || false,
      skipFailedRequests: metadata.skipFailedRequests || false,
      keyGenerator: metadata.keyGenerator,
      limiterName: metadata.limiterName,
    };
  }

  private getIdentifier(
    request: any,
    config: RateLimitOptions & { limiterName?: string },
  ): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    if (request.user?.id) {
      return `user-${request.user.id}`;
    }

    const ip =
      request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      'unknown';

    return `ip-${ip}`;
  }
}

export const RateLimit = (config: RateLimitOptions & { limiterName?: string }) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimitConfig', config, descriptor?.value || target);
  };
};

export const Strict = () => RateLimit({ limit: 5, windowMs: 60 * 1000 });
export const Normal = () => RateLimit({ limit: 30, windowMs: 60 * 1000 });
export const Relaxed = () => RateLimit({ limit: 100, windowMs: 60 * 1000 });
