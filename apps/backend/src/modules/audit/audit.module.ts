import { Module } from '@nestjs/common';

import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';

@Module({
  imports: [],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule { }
