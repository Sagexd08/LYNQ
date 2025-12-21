import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(HttpLoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request>();
        const start = Date.now();

        return next.handle().pipe(
            tap(() => {
                const res = context.switchToHttp().getResponse<Response>();
                const status = res?.statusCode;
                const duration = Date.now() - start;
                this.logger.log(`${req?.method} ${req?.url} -> ${status} (${duration}ms)`);
            }),
        );
    }
}