import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
@Injectable()
export class AuditService {
  constructor(private readonly supabaseService: SupabaseService) { }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async record(payload: Partial<AuditLog>) {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Audit log failure should ideally not break the main flow, or maybe it should.
      // For now, logging error is safer.
      console.error('Audit log failed', error);
      return null;
    }
    return data as AuditLog;
  }
}
