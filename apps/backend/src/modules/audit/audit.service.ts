import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLog } from '../../common/types/database.types';

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
      console.error('Audit log failed', error);
      return null;
    }
    return data as AuditLog;
  }
}
