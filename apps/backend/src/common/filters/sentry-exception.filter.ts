import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(SentryExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        if (Sentry.getCurrentHub().getClient()) {
            Sentry.captureException(exception, {
                extra: {
                    path: request?.url,
                    method: request?.method,
                },
            });
        }

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const payload = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

        this.logger.error(`HTTP ${status} ${request?.method} ${request?.url}`, exception instanceof Error ? exception.stack : `${exception}`);

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request?.url,
            message: payload,
        });
    }
}