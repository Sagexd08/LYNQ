import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SupabaseService } from '../../modules/supabase/supabase.service';
import { TRANSACTIONAL_KEY } from '../decorators/transactional.decorator';


@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isTransactional = this.reflector.get<boolean>(
      TRANSACTIONAL_KEY,
      context.getHandler(),
    );

    if (!isTransactional) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;

    this.logger.log(`Starting transaction for ${className}.${methodName}`);

    
    request.transactionId = this.generateTransactionId();
    request.transactionStartTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - request.transactionStartTime;
        this.logger.log(
          `Transaction committed for ${className}.${methodName} (${duration}ms)`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - request.transactionStartTime;
        this.logger.error(
          `Transaction rolled back for ${className}.${methodName} (${duration}ms): ${error.message}`,
          error.stack,
        );
        return throwError(() => error);
      }),
    );
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}


